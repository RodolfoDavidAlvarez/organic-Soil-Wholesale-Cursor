import { supabase } from "../db/supabase.js";
import { notifyIntakeTeam } from "./intakeNotify.js";

/**
 * Create an ops_work_orders row from a freshly inserted OSW `orders` row.
 *
 * This is the OSW side of the unified intake pipeline: every OSW customer order
 * fans out into ops_work_orders so CompostDeveloper.com's intake queue can
 * accept/reject it within 15 minutes — same way MyOrganicSoil orders do today.
 *
 * Returns the created work order id (or null if nothing was created, e.g. for
 * pickup-already-paid orders that don't need an accept/reject step).
 */

interface OswOrderRow {
  id: number;
  order_number: string | null;
  business_name: string | null;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  delivery_type: string | null;
  pickup_location: string | null;
  address: string | null;
  delivery_address_json: any;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  order_items: any;
  subtotal: number | null;
  total: number | null;
  status: string | null;
  payment_status: string | null;
  notes: string | null;
  special_instructions: string | null;
  customer_profile_id: string | null;
  created_at: string | null;
}

interface OrderItemRow {
  product_id: number | null;
  product_name?: string | null;
  quantity: number;
  size_option: string | null;
  unit_price: number | null;
  total_price: number | null;
}

function generateWoNumber() {
  const d = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 900 + 100);
  return `WO-${yyyymmdd}-OSW${rand}`;
}

function pickPrimary(items: OrderItemRow[]): OrderItemRow | null {
  if (!items.length) return null;
  return items.reduce((max, cur) => ((cur.total_price ?? 0) > (max.total_price ?? 0) ? cur : max), items[0]);
}

async function resolveOrCreateClient(order: OswOrderRow): Promise<{ clientId: number | null; clientName: string | null }> {
  const clientName = (order.business_name || order.customer_name || "").trim();
  if (!clientName) return { clientId: null, clientName: null };

  const { data: existing } = await supabase
    .from("ops_clients")
    .select("id")
    .ilike("name", clientName)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return { clientId: existing.id, clientName };

  const deliveryJson = order.delivery_address_json || {};
  const { data: created } = await supabase
    .from("ops_clients")
    .insert({
      name: clientName,
      contact_name: order.customer_name || null,
      contact_email: order.email || null,
      contact_phone: order.phone || null,
      address:
        order.address ||
        [deliveryJson.line1, deliveryJson.city, deliveryJson.state, deliveryJson.zip].filter(Boolean).join(", ") ||
        null,
    })
    .select("id")
    .single();
  return { clientId: created?.id || null, clientName };
}

export async function createWorkOrderFromOswOrder(orderId: number): Promise<number | null> {
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single<OswOrderRow>();

  if (orderErr || !order) {
    console.error("[workOrderSync] order lookup failed:", orderErr);
    return null;
  }

  // Pull line items from the relational table; fall back to the JSONB column if empty.
  const { data: relItems } = await supabase
    .from("order_items")
    .select("product_id, quantity, unit_price, total_price, size_option, products(name)")
    .eq("order_id", orderId);

  const lineItems: OrderItemRow[] =
    (relItems || []).map((row: any) => ({
      product_id: row.product_id,
      product_name: row.products?.name || null,
      quantity: row.quantity,
      size_option: row.size_option,
      unit_price: row.unit_price,
      total_price: row.total_price,
    })) ||
    (Array.isArray(order.order_items)
      ? order.order_items.map((j: any) => ({
          product_id: j.product_id || null,
          product_name: j.product_name || j.name || null,
          quantity: j.quantity || 1,
          size_option: j.size_option || null,
          unit_price: (j.unit_price_cents ?? 0) / 100,
          total_price: ((j.unit_price_cents ?? 0) / 100) * (j.quantity || 1),
        }))
      : []);

  const primary = pickPrimary(lineItems);
  const productName =
    lineItems.length > 1 ? `OSW Order Bundle (${lineItems.length} lines)` : primary?.product_name || "OSW Order";
  const sizeCategory = primary?.size_option || "other";
  const totalQuantity = lineItems.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;

  const { clientId, clientName } = await resolveOrCreateClient(order);

  const deliveryJson = order.delivery_address_json || {};
  const isPickup = (order.delivery_type || "").toLowerCase() === "pickup";

  const woNumber = generateWoNumber();
  const acceptDeadline = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { data: wo, error: woErr } = await supabase
    .from("ops_work_orders")
    .insert({
      organization_id: Number.parseInt(process.env.SSW_OPS_ORG_ID || "1", 10) || 1,
      wo_number: woNumber,
      product_type: "standard",
      product_name: productName,
      product_id: primary?.product_id ? String(primary.product_id) : null,
      size_category: sizeCategory,
      size_category_name: sizeCategory,
      quantity: totalQuantity,
      quantity_type: "unit",
      custom_notes: [
        `OSW Order: ${order.order_number || order.id}`,
        order.notes ? `Notes: ${order.notes}` : "",
        order.special_instructions ? `Special instructions: ${order.special_instructions}` : "",
        order.payment_status ? `Payment: ${order.payment_status}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      work_order_notes: order.notes || null,
      needs_transportation: !isPickup,
      destination_address: isPickup ? null : order.address || deliveryJson.line1 || null,
      destination_city: deliveryJson.city || null,
      destination_state: deliveryJson.state || null,
      destination_zip: deliveryJson.zip || null,
      preferred_delivery_date: order.preferred_date || null,
      preferred_delivery_time:
        order.preferred_time_start && order.preferred_time_end
          ? `${order.preferred_time_start} - ${order.preferred_time_end}`
          : null,
      status: "pending",
      priority: (order.total ?? 0) >= 10000 ? "high" : "normal",
      order_type: isPickup ? "osw_pickup" : "osw_delivery",
      client_id: clientId,
      client_name: clientName,
      created_by: order.customer_name || order.business_name || "OSW Customer",
      source_channel: "osw",
      source_order_id: order.id,
      source_order_number: order.order_number || String(order.id),
      accept_deadline: acceptDeadline,
    })
    .select()
    .single();

  if (woErr || !wo) {
    console.error("[workOrderSync] WO creation failed:", woErr);
    return null;
  }

  // Mirror line items into ops_work_order_lines so the CD line-item display works.
  if (lineItems.length) {
    const lineRows = lineItems.map((item, index) => ({
      work_order_id: wo.id,
      product_type: "standard",
      product_name: item.product_name || productName,
      product_id: item.product_id ? String(item.product_id) : null,
      size_category: item.size_option || sizeCategory,
      size_category_name: item.size_option || sizeCategory,
      quantity: item.quantity || 1,
      quantity_type: "unit",
      sort_order: index,
    }));
    const { error: lineErr } = await supabase.from("ops_work_order_lines").insert(lineRows);
    if (lineErr) console.error("[workOrderSync] line-item insert failed:", lineErr);
  }

  // Fire SMS + Email to Kerry / Sabrina / Rodo so they see it in CD intake queue.
  try {
    await notifyIntakeTeam(wo as any);
  } catch (notifyErr) {
    console.error("[workOrderSync] intake notify failed (non-blocking):", notifyErr);
  }

  return wo.id;
}

/**
 * Reverse direction: when a CD operator changes ops_work_orders.status (accept/reject/produce/deliver),
 * propagate that change back to the originating OSW orders row.
 *
 * Status mapping mirrors MOS's STATUS_MAP at myorganicsoil.com/api/index.js:1678 with osw-specific
 * extensions for pickup-vs-delivery and rejection.
 */
const WO_TO_OSW_STATUS: Record<string, string> = {
  pending: "pending",
  acknowledged: "confirmed",
  scheduled: "confirmed",
  blending: "in_production",
  in_progress: "in_production",
  blend_complete: "ready_for_pickup",
  awaiting_pickup: "ready_for_pickup",
  out_for_delivery: "out_for_delivery",
  delivered: "completed",
  completed: "completed",
  cancelled: "cancelled",
};

export async function propagateWorkOrderStatusToOswOrder(workOrderId: number): Promise<void> {
  const { data: wo } = await supabase
    .from("ops_work_orders")
    .select("source_channel, source_order_id, status")
    .eq("id", workOrderId)
    .single();

  if (!wo || wo.source_channel !== "osw" || !wo.source_order_id) return;

  const mappedStatus = WO_TO_OSW_STATUS[wo.status];
  if (!mappedStatus) return;

  await supabase
    .from("orders")
    .update({
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wo.source_order_id);
}
