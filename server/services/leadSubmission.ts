import { supabase } from "../db/supabase.js";
import { sendAdminLeadNotification, sendCustomerQuoteConfirmation } from "./emailNotifications.js";
import { forwardToMosLeads, type MosLeadSource } from "./forwardToMosLeads.js";
import { sendLeadSmsAlert } from "./smsNotifications.js";

export interface OrderCallbackLineItem {
  product_id?: number;
  product_name?: string;
  product_slug?: string;
  format?: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  unit?: string;
  flatbed_spots?: number;
  mode?: string;
}

export interface OrderCallbackOrder {
  line_items?: OrderCallbackLineItem[];
  item_count?: number;
  estimated_total?: number;
  flatbed_spots?: number;
  delivery_zip?: string;
  delivery_fee?: number;
  delivery_city?: string;
  delivery_state?: string;
}

export interface LeadSubmissionPayload {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  preferred_date?: string;
  lead_type?: string;
  source?: string;
  source_url?: string;
  order?: OrderCallbackOrder;
}

export interface LeadSubmissionResult {
  leadId: number;
  message: string;
  submittedAt: string;
}

export class LeadSubmissionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function formatOrderNotes(order: OrderCallbackOrder | undefined, notes?: string): string {
  const lines: string[] = [];
  if (order?.line_items?.length) {
    lines.push("ORDER LINES:");
    for (const item of order.line_items) {
      const qty = item.quantity ?? 1;
      const name = item.product_name || "Product";
      const format = item.format ? ` (${item.format})` : "";
      const total =
        item.line_total != null
          ? ` — $${Number(item.line_total).toFixed(2)}`
          : item.unit_price != null
            ? ` — $${(Number(item.unit_price) * qty).toFixed(2)}`
            : "";
      const spots =
        item.flatbed_spots && item.flatbed_spots > 0
          ? ` [+${item.flatbed_spots} spot${item.flatbed_spots === 1 ? "" : "s"}]`
          : "";
      lines.push(`- ${qty}x ${name}${format}${total}${spots}`);
    }
  }
  if (order?.estimated_total != null) {
    lines.push(`Estimated products: $${Number(order.estimated_total).toFixed(2)}`);
  }
  if (order?.flatbed_spots != null && order.flatbed_spots > 0) {
    lines.push(`Flatbed spots: ${order.flatbed_spots}/22`);
  }
  if (order?.delivery_zip) {
    const fee =
      order.delivery_fee != null ? ` · est. delivery $${Number(order.delivery_fee).toFixed(2)}` : "";
    const place = [order.delivery_city, order.delivery_state].filter(Boolean).join(", ");
    lines.push(`Delivery ZIP: ${order.delivery_zip}${place ? ` (${place})` : ""}${fee}`);
  }
  if (notes) {
    lines.push("", `Customer note: ${notes}`);
  }
  return lines.join("\n") || notes || "No additional notes";
}

export async function processLeadSubmission(
  payload: LeadSubmissionPayload
): Promise<LeadSubmissionResult> {
  const { name, phone, notes, preferred_date, order, source_url } = payload;
  const isOrderCallback =
    payload.lead_type === "order_callback" || payload.source === "osw_order_callback";

  if (!name || !phone) {
    throw new LeadSubmissionError(
      isOrderCallback ? "Name and phone are required" : "Name, email, and phone are required",
      400,
    );
  }

  if (!isOrderCallback && !payload.email) {
    throw new LeadSubmissionError("Name, email, and phone are required", 400);
  }

  const emailRaw = (payload.email || "").trim();
  const email =
    emailRaw ||
    (isOrderCallback
      ? `callback+${String(phone).replace(/\D/g, "").slice(-10) || "unknown"}@leads.organicsoilwholesale.com`
      : "");

  if (emailRaw) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRaw)) {
      throw new LeadSubmissionError("Invalid email format", 400);
    }
  }

  if (isOrderCallback && (!order?.line_items || order.line_items.length === 0)) {
    throw new LeadSubmissionError("Add at least one order line before requesting a callback", 400);
  }

  const submittedAt = new Date().toISOString();
  const orderNotes = isOrderCallback ? formatOrderNotes(order, notes) : notes || "No additional notes";
  const itemCount = order?.line_items?.length ?? 0;
  const estimated = order?.estimated_total != null ? Number(order.estimated_total) : null;
  const subject = isOrderCallback
    ? `Callback requested — ${itemCount} line item${itemCount === 1 ? "" : "s"}${
        estimated != null ? ` · ~$${estimated.toFixed(0)}` : ""
      }`
    : "Lead Form Submission";

  const insertData: Record<string, unknown> = {
    name,
    email,
    subject,
    message: `Phone: ${phone}\n\n${orderNotes}`,
    created_at: submittedAt,
  };
  if (preferred_date) insertData.preferred_date = preferred_date;

  const { data, error } = await supabase
    .from("contact_messages")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new LeadSubmissionError(
      error.message || "Failed to submit lead",
      500
    );
  }

  try {
    const notifyNotes = isOrderCallback ? orderNotes : notes;
    await Promise.all([
      sendAdminLeadNotification({
        name,
        email,
        phone,
        notes: notifyNotes,
        submittedAt,
      }),
      emailRaw
        ? sendCustomerQuoteConfirmation({
            name,
            email: emailRaw,
            phone,
            notes: notifyNotes,
            submittedAt,
          })
        : Promise.resolve(),
      sendLeadSmsAlert({ name, phone, notes: notifyNotes }),
    ]);
  } catch (notificationError) {
    console.error("Failed to send notifications:", notificationError);
  }

  const mosSource: MosLeadSource = isOrderCallback
    ? "osw_order_callback"
    : "osw_lead_form";

  forwardToMosLeads({
    full_name: name,
    email,
    phone,
    message: isOrderCallback
      ? `Callback requested — ${itemCount} line items${
          estimated != null ? ` · ~$${estimated.toFixed(0)}` : ""
        }\n\n${orderNotes}`
      : notes || undefined,
    source: mosSource,
    source_url: source_url || "https://organicsoilwholesale.com/",
    source_data: {
      osw_contact_message_id: data.id,
      lead_type: isOrderCallback ? "order_callback" : "lead_form",
      ...(isOrderCallback && order ? { order } : {}),
    },
  });

  return {
    leadId: data.id,
    message: isOrderCallback
      ? "Thanks — a rep will call you about this order shortly."
      : "Thank you! We'll contact you shortly.",
    submittedAt,
  };
}
