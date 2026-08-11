import express from "express";
import Stripe from "stripe";
import { supabase } from "../db/supabase.js";
import {
  createSession,
  getSession,
  attachConversation,
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  setPickupAt,
  setCustomerInfo,
  hasLargeQuantity,
  cartTotal,
  activeSessionsToday,
} from "../services/voiceAgentSession.js";
import {
  VOICE_CATALOG,
  findCatalogItem,
  mulchForArea,
  compostTopdress,
  wormCastingsBoost,
  bundleSuggestion,
} from "../services/voiceAgentRecommend.js";
import {
  getPickupOptions,
  validatePickup,
  PICKUP_TIMEZONE,
  OPEN_HOUR_LOCAL,
  CLOSE_HOUR_LOCAL,
  MIN_LEAD_MINUTES,
} from "../services/voiceAgentHours.js";

const router = express.Router();

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";
const SESSION_BUDGET_USD_PER_SESSION = 0.8;
const LARGE_QUANTITY_THRESHOLD = 50;
const VOICE_LOCATION_ID = 1;

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

function isUnderDailyCap(): boolean {
  const cap = Number(process.env.VOICE_AGENT_DAILY_USD || "0");
  if (!cap) return true;
  const projected = activeSessionsToday() * SESSION_BUDGET_USD_PER_SESSION;
  return projected < cap;
}

function summarizeSession(sessionId: string) {
  const s = getSession(sessionId);
  if (!s) return null;
  return {
    sessionId: s.sessionId,
    items: s.cart,
    totalItems: s.cart.reduce((n, i) => n + i.quantity, 0),
    totalPrice: Number(cartTotal(s).toFixed(2)),
    pickupAt: s.pickupAt,
    pickupKind: s.pickupKind,
    customer: s.customer,
    isLargeOrder: hasLargeQuantity(s, LARGE_QUANTITY_THRESHOLD),
  };
}

router.get("/health", (_req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  res.json({
    configured: Boolean(apiKey && agentId),
    hasToolSecret: Boolean(process.env.VOICE_AGENT_TOOL_SECRET),
    dailyCapUsd: Number(process.env.VOICE_AGENT_DAILY_USD || "0") || null,
  });
});

router.post("/signed-url", async (_req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    if (!apiKey || !agentId) {
      return res.status(503).json({ error: "voice_agent_not_configured" });
    }
    if (!isUnderDailyCap()) {
      return res.status(429).json({ error: "voice_agent_daily_cap_reached" });
    }
    const url = `${ELEVENLABS_API_BASE}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;
    const response = await fetch(url, { headers: { "xi-api-key": apiKey } });
    if (!response.ok) {
      const text = await response.text();
      console.error("[voice-agent] signed-url fetch failed:", response.status, text);
      return res.status(502).json({ error: "elevenlabs_signed_url_failed" });
    }
    const data = (await response.json()) as { signed_url?: string };
    if (!data.signed_url) {
      return res.status(502).json({ error: "elevenlabs_signed_url_missing" });
    }
    const session = createSession();
    res.json({
      signedUrl: data.signed_url,
      sessionId: session.sessionId,
      agentId,
    });
  } catch (err) {
    console.error("[voice-agent] signed-url error", err);
    res.status(500).json({ error: "voice_agent_signed_url_failed" });
  }
});

router.get("/cart/:sessionId", (req, res) => {
  const summary = summarizeSession(req.params.sessionId);
  if (!summary) return res.status(404).json({ error: "session_not_found" });
  res.json(summary);
});

router.post("/tools/get_products", (_req, res) => {
  res.json({
    products: VOICE_CATALOG.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      format: p.format,
      unit: p.unit,
      unitPrice: p.unitPrice,
    })),
  });
});

router.post("/tools/attach_conversation", (req, res) => {
  const { session_id, conversation_id } = req.body || {};
  if (!session_id || !conversation_id) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const s = attachConversation(session_id, conversation_id);
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json({ ok: true });
});

router.post("/tools/get_cart", (req, res) => {
  const { session_id } = req.body || {};
  const summary = summarizeSession(session_id);
  if (!summary) return res.status(404).json({ error: "session_not_found" });
  res.json(summary);
});

router.post("/tools/add_to_cart", (req, res) => {
  const { session_id, product_id, format, quantity } = req.body || {};
  if (!session_id || !product_id || !format || !quantity) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const item = findCatalogItem(Number(product_id), String(format));
  if (!item) {
    return res.status(404).json({
      error: "product_not_in_catalog",
      message: "Use get_products first; only listed products can be added.",
    });
  }
  const qty = Math.max(1, Math.floor(Number(quantity)));
  const s = addItem(session_id, {
    productId: item.productId,
    productName: item.productName,
    productSlug: slugify(item.productName),
    format: item.format,
    unit: item.unit,
    unitPrice: item.unitPrice,
    quantity: qty,
  });
  if (!s) return res.status(404).json({ error: "session_not_found" });
  const summary = summarizeSession(session_id)!;
  const bundle = bundleSuggestion(s.cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  res.json({
    ...summary,
    bundleSuggestion: bundle,
    largeOrderHint: summary.isLargeOrder
      ? `Quantities over ${LARGE_QUANTITY_THRESHOLD} bags need pickup coordination — call request_large_order instead of set_pickup_time.`
      : null,
  });
});

router.post("/tools/update_quantity", (req, res) => {
  const { session_id, product_id, format, quantity } = req.body || {};
  if (!session_id || !product_id || !format || quantity == null) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const s = setQuantity(session_id, Number(product_id), String(format), Math.floor(Number(quantity)));
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json(summarizeSession(session_id));
});

router.post("/tools/remove_item", (req, res) => {
  const { session_id, product_id, format } = req.body || {};
  if (!session_id || !product_id || !format) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const s = removeItem(session_id, Number(product_id), String(format));
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json(summarizeSession(session_id));
});

router.post("/tools/clear_cart", (req, res) => {
  const { session_id } = req.body || {};
  const s = clearCart(session_id);
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json(summarizeSession(session_id));
});

router.post("/tools/recommend", (req, res) => {
  const { use_case, square_feet, depth_inches, plant_count } = req.body || {};
  if (use_case === "mulch_for_area") {
    if (!square_feet || !depth_inches) {
      return res.status(400).json({ error: "need_square_feet_and_depth" });
    }
    return res.json(mulchForArea(Number(square_feet), Number(depth_inches)));
  }
  if (use_case === "compost_topdress") {
    if (!square_feet) return res.status(400).json({ error: "need_square_feet" });
    return res.json(compostTopdress(Number(square_feet)));
  }
  if (use_case === "worm_castings_boost") {
    if (!plant_count) return res.status(400).json({ error: "need_plant_count" });
    return res.json(wormCastingsBoost(Number(plant_count)));
  }
  res.status(400).json({
    error: "unknown_use_case",
    valid_use_cases: ["mulch_for_area", "compost_topdress", "worm_castings_boost"],
  });
});

router.post("/tools/get_pickup_options", (req, res) => {
  const options = getPickupOptions(1);
  res.json({
    timezone: PICKUP_TIMEZONE,
    openHourLocal: OPEN_HOUR_LOCAL,
    closeHourLocal: CLOSE_HOUR_LOCAL,
    minLeadMinutes: MIN_LEAD_MINUTES,
    mode: "asap",
    options,
  });
});

router.post("/tools/set_pickup_time", (req, res) => {
  const { session_id, pickup_at } = req.body || {};
  if (!session_id || !pickup_at) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const validation = validatePickup(String(pickup_at));
  if (validation.ok === false) {
    return res.status(400).json({
      error: validation.reason,
      message: validation.message,
      validOptions: getPickupOptions(),
    });
  }
  const s = setPickupAt(session_id, validation.pickupAtIso, "standard");
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json({ ok: true, pickupLabel: validation.label, pickupAt: validation.pickupAtIso, pickupKind: "standard" });
});

router.post("/tools/request_large_order", (req, res) => {
  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: "missing_fields" });
  const s = setPickupAt(session_id, new Date().toISOString(), "coordinated");
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json({
    ok: true,
    pickupKind: "coordinated",
    message: "Order will be flagged for pickup coordination — our team will reach out to confirm a pickup window.",
  });
});

router.post("/tools/set_customer_info", (req, res) => {
  const { session_id, name, phone, email } = req.body || {};
  if (!session_id) return res.status(400).json({ error: "missing_fields" });
  const s = setCustomerInfo(session_id, { name, phone, email });
  if (!s) return res.status(404).json({ error: "session_not_found" });
  res.json({ ok: true, customer: s.customer });
});

router.post("/tools/start_checkout", (req, res) => {
  const { session_id } = req.body || {};
  const summary = summarizeSession(session_id);
  if (!summary) return res.status(404).json({ error: "session_not_found" });
  if (summary.items.length === 0) {
    return res.status(400).json({
      error: "cart_empty",
      message: "Add at least one item before starting checkout.",
    });
  }
  if (!summary.pickupAt) {
    return res.status(400).json({
      error: "pickup_missing",
      message: summary.isLargeOrder
        ? "Call request_large_order to flag this for pickup coordination."
        : "Call set_pickup_time first.",
    });
  }
  res.json({
    ok: true,
    handoff: {
      message: "Customer should now tap the Pay button to enter checkout.",
      total: summary.totalPrice,
      items: summary.items.length,
      pickupKind: summary.pickupKind,
    },
  });
});

router.post("/create-checkout-session/:sessionId", async (req, res) => {
  try {
    const summary = summarizeSession(req.params.sessionId);
    if (!summary) return res.status(404).json({ error: "session_not_found" });
    if (summary.items.length === 0) return res.status(400).json({ error: "cart_empty" });
    if (!summary.pickupAt) return res.status(400).json({ error: "pickup_missing" });

    const customer = summary.customer;
    const isCoordinated = summary.pickupKind === "coordinated";
    const orderNumber = `VO-${Date.now().toString(36).toUpperCase()}`;
    const totalDollars = summary.totalPrice;
    const totalCents = Math.round(totalDollars * 100);

    const itemsJson = summary.items.map((i) => ({
      product_id: i.productId,
      product_name: i.productName,
      format: i.format,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: Number((i.unitPrice * i.quantity).toFixed(2)),
    }));

    const orderInsert: Record<string, unknown> = {
      order_number: orderNumber,
      business_name: customer.name || "Voice order",
      customer_name: customer.name || null,
      email: customer.email || `voice+${req.params.sessionId.slice(0, 8)}@organicsoilwholesale.com`,
      customer_email: customer.email || null,
      phone: customer.phone || "",
      customer_phone_formatted: customer.phone || null,
      delivery_type: "pickup",
      pickup_location: "Phoenix",
      order_items: itemsJson,
      subtotal: totalCents,
      total: totalCents,
      status: "pending_payment",
      order_type: "pickup",
      fulfillment_type: isCoordinated ? "voice_large" : "voice",
      arrival_time: isCoordinated ? null : summary.pickupAt,
      estimated_preparation_time: isCoordinated ? null : 30,
      notes: isCoordinated
        ? `[VOICE | LARGE] Quantities over 50 — coordinate pickup window with customer. Voice session ${req.params.sessionId}.`
        : `[VOICE] Voice-assistant order. Voice session ${req.params.sessionId}.`,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderInsert)
      .select()
      .single();
    if (orderError || !order) {
      console.error("[voice-agent] order insert failed", orderError);
      return res.status(500).json({
        error: "order_insert_failed",
        message: orderError?.message || "Could not create order.",
      });
    }

    const lineItems = summary.items.map((i) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${i.productName} (${i.format})`,
          description: `Quantity ${i.quantity}`,
        },
        unit_amount: Math.round(i.unitPrice * 100),
      },
      quantity: i.quantity,
    }));

    const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const session = await getStripe().checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      customer_email: customer.email || undefined,
      phone_number_collection: { enabled: !customer.phone },
      success_url: `${origin}/voice-receipt?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/?voice_canceled=1`,
      metadata: {
        order_id: String(order.id),
        order_number: orderNumber,
        voice_session_id: req.params.sessionId,
        fulfillment_type: orderInsert.fulfillment_type as string,
        pickup_kind: summary.pickupKind || "standard",
        pickup_at: summary.pickupAt || "",
        customer_name: customer.name || "",
        customer_phone: customer.phone || "",
      },
    });

    await supabase
      .from("orders")
      .update({ stripe_payment_link_id: session.id })
      .eq("id", order.id);

    res.json({
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
      orderNumber,
      pickupKind: summary.pickupKind,
    });
  } catch (err: any) {
    console.error("[voice-agent] create-checkout-session error", err);
    res.status(500).json({
      error: "voice_checkout_failed",
      message: err?.message || "Could not start checkout.",
    });
  }
});

router.post("/order/:orderId/send-sms", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  if (!orderId) return res.status(400).json({ error: "invalid_order_id" });
  try {
    const { sendSms, formatPickupConfirmationSms } = await import("../services/twilioSms.js");
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, business_name, phone, customer_phone_formatted, total, order_items, arrival_time, fulfillment_type, notes")
      .eq("id", orderId)
      .single();
    if (error || !order) return res.status(404).json({ error: "not_found" });
    const phone = order.customer_phone_formatted || order.phone;
    if (!phone) return res.status(400).json({ error: "no_phone_on_order" });
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const itemSummary = items
      .map((i: any) => `${i.quantity}x ${i.product_name} (${i.format})`)
      .join(", ");
    const isCoordinated = order.fulfillment_type === "voice_large";
    const pickupLabel = order.arrival_time
      ? new Date(order.arrival_time).toLocaleString("en-US", {
          timeZone: "America/Phoenix",
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;
    const baseUrl = process.env.PUBLIC_SITE_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const body = formatPickupConfirmationSms({
      customerName: order.customer_name || order.business_name || null,
      orderNumber: order.order_number,
      itemSummary,
      pickupLabel,
      totalDollars: (order.total || 0) / 100,
      isCoordinated,
      receiptUrl: `${baseUrl}/voice-receipt?order_id=${orderId}`,
    });
    const result = await sendSms({ to: phone, body });
    if (result.ok === false) {
      return res.status(502).json({ error: result.error });
    }
    res.json({ ok: true, sid: result.sid, sentTo: phone, body });
  } catch (err: any) {
    console.error("[voice-agent] manual SMS error", err);
    res.status(500).json({ error: "sms_failed", message: err?.message });
  }
});

router.get("/order/:orderId", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  if (!orderId) return res.status(400).json({ error: "invalid_order_id" });
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, business_name, customer_name, total, order_items, arrival_time, status, fulfillment_type, notes, created_at, pickup_location")
      .eq("id", orderId)
      .single();
    if (error || !data) return res.status(404).json({ error: "not_found" });
    if (!String(data.notes || "").includes("[VOICE")) {
      return res.status(404).json({ error: "not_voice_order" });
    }
    res.json({
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name || data.business_name,
      totalDollars: (data.total || 0) / 100,
      items: Array.isArray(data.order_items) ? data.order_items : [],
      pickupAt: data.arrival_time,
      pickupLocation: data.pickup_location,
      status: data.status,
      isCoordinated: data.fulfillment_type === "voice_large",
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error("[voice-agent] order fetch error", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default router;
