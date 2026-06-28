/**
 * Resend Webhook Handler
 * Updates sp_customers newsletter engagement + email_events log.
 */

import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string | string[];
    subject?: string;
    user_agent?: string;
    html?: string;
    text?: string;
    reply_to?: string;
    tags?: Array<{ name: string; value: string }>;
  };
}

function normalizeEmail(to: string | string[] | undefined): string | null {
  if (!to) return null;
  const raw = Array.isArray(to) ? to[0] : to;
  return raw?.toLowerCase().trim() || null;
}

function deviceFromUserAgent(ua?: string): string {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (/mobile|iphone|android|ipad/.test(s)) return "mobile";
  if (/windows|macintosh|linux|cros/.test(s)) return "desktop";
  return "unknown";
}

function newsletterIdFromTags(tags?: Array<{ name: string; value: string }>): string | null {
  const tag = (tags || []).find((t) => t.name === "newsletter_id" || t.name === "campaign");
  return tag?.value || null;
}

async function findCustomer(email: string) {
  const { data } = await supabase
    .from("sp_customers")
    .select("id, newsletter_email_opens, newsletter_email_clicks, newsletter_subscribed")
    .ilike("email", email)
    .maybeSingle();
  return data;
}

async function logEvent(payload: {
  email: string;
  customerId?: number | null;
  eventType: string;
  newsletterId?: string | null;
  resendEmailId?: string | null;
  userAgent?: string | null;
}) {
  const device = deviceFromUserAgent(payload.userAgent || undefined);
  await supabase.from("email_events").insert({
    email: payload.email,
    customer_id: payload.customerId ?? null,
    event_type: payload.eventType,
    newsletter_id: payload.newsletterId ?? null,
    resend_email_id: payload.resendEmailId ?? null,
    user_agent: payload.userAgent ?? null,
    device_type: device,
  });
}

async function updateNewsletterEngagement(
  email: string,
  eventType: "opened" | "clicked" | "bounced" | "complained",
  data: ResendWebhookEvent["data"],
) {
  const customer = await findCustomer(email);
  const newsletterId = newsletterIdFromTags(data.tags);
  const device = deviceFromUserAgent(data.user_agent);
  const now = new Date().toISOString();

  await logEvent({
    email,
    customerId: customer?.id,
    eventType,
    newsletterId,
    resendEmailId: data.email_id,
    userAgent: data.user_agent,
  });

  if (!customer) return;

  const patch: Record<string, unknown> = {};

  if (eventType === "opened") {
    patch.newsletter_email_opens = (customer.newsletter_email_opens || 0) + 1;
    patch.newsletter_last_opened_at = now;
    patch.newsletter_last_open_device = device;
  }

  if (eventType === "clicked") {
    patch.newsletter_email_clicks = (customer.newsletter_email_clicks || 0) + 1;
    patch.newsletter_last_clicked_at = now;
    if (!customer.newsletter_email_opens) {
      patch.newsletter_email_opens = 1;
    }
  }

  if (eventType === "bounced" || eventType === "complained") {
    patch.newsletter_subscribed = false;
    patch.newsletter_verification_status = eventType === "bounced" ? "Bounced" : "Complained";
    patch.newsletter_unsubscribed_at = now;
  }

  if (Object.keys(patch).length) {
    await supabase.from("sp_customers").update(patch).eq("id", customer.id);
  }

  if (newsletterId && (eventType === "opened" || eventType === "clicked")) {
    const col = eventType === "opened" ? "total_opens" : "total_clicks";
    const deviceCol = eventType === "opened" && device === "mobile" ? "mobile_opens"
      : eventType === "opened" && device === "desktop" ? "desktop_opens" : null;

    const { data: campaign } = await supabase
      .from("newsletter_campaigns")
      .select("id, total_opens, total_clicks, total_sent, mobile_opens, desktop_opens")
      .eq("newsletter_id", newsletterId)
      .maybeSingle();

    if (campaign) {
      const campPatch: Record<string, number> = {
        [col]: (campaign[col] || 0) + 1,
      };
      if (deviceCol) {
        campPatch[deviceCol] = (campaign[deviceCol] || 0) + 1;
      }
      await supabase.from("newsletter_campaigns").update(campPatch).eq("id", campaign.id);
    }
  }
}

/** Legacy cold-outreach table — keep updating if row exists */
async function updateRepresentativeContact(email: string, status: string) {
  await supabase
    .from("representative_contacts")
    .update({
      email_status: status,
      email_status_updated_at: new Date().toISOString(),
    })
    .eq("email", email);
}

router.post("/webhook", async (req, res) => {
  try {
    const event: ResendWebhookEvent = req.body;
    const email = normalizeEmail(event.data?.to);

    console.log("[Resend Webhook]", event.type, email || event.data?.from);

    switch (event.type) {
      case "email.delivered":
        if (email) await updateRepresentativeContact(email, "delivered");
        break;

      case "email.opened":
        if (email) {
          await updateNewsletterEngagement(email, "opened", event.data);
          await updateRepresentativeContact(email, "opened");
        }
        break;

      case "email.clicked":
        if (email) {
          await updateNewsletterEngagement(email, "clicked", event.data);
          await updateRepresentativeContact(email, "clicked");
        }
        break;

      case "email.bounced":
        if (email) {
          await updateNewsletterEngagement(email, "bounced", event.data);
          await updateRepresentativeContact(email, "bounced");
        }
        break;

      case "email.complained":
        if (email) await updateNewsletterEngagement(email, "complained", event.data);
        break;

      case "email.received":
        if (event.data.from) {
          await updateRepresentativeContact(event.data.from.toLowerCase(), "replied");
        }
        break;

      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Resend Webhook] Error:", error);
    res.status(200).json({ received: true, error: "Processing error" });
  }
});

export default router;
