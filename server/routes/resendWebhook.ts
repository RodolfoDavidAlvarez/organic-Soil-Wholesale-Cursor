/**
 * Local Express Resend webhook — same pipeline as production Vercel handler.
 * Production: api/resend/webhook.js → shared/newsletterEngagement.js
 */

import { Router } from "express";
import { supabase } from "../supabaseClient";
import { handleResendNewsletterWebhook } from "../../shared/newsletterEngagement.js";
import {
  verifyResendWebhookSignature,
} from "../../shared/resendWebhookVerify.js";

const router = Router();

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

function normalizeEmail(to: string | string[] | undefined): string | null {
  if (!to) return null;
  const raw = Array.isArray(to) ? to[0] : to;
  return raw?.toLowerCase().trim() || null;
}

router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    const rawBody =
      typeof req.body === "string"
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString("utf8")
          : JSON.stringify(req.body || {});

    if (secret) {
      const verified = verifyResendWebhookSignature(rawBody, req.headers as Record<string, string>, secret);
      if (!verified.ok) {
        console.error("[Resend Webhook] signature failed:", verified.reason);
        return res.status(401).json({ error: "Invalid signature", reason: verified.reason });
      }
    }

    const event = typeof req.body === "object" && req.body ? req.body : JSON.parse(rawBody);
    const email = normalizeEmail(event.data?.to);

    console.log("[Resend Webhook]", event.type, email || event.data?.from);

    const result = await handleResendNewsletterWebhook(supabase, event);

    // Cold-outreach side table (local/dev only path still useful)
    if (email) {
      const kind = String(event.type || "").replace(/^email\./, "");
      if (["delivered", "opened", "clicked", "bounced"].includes(kind)) {
        await updateRepresentativeContact(email, kind);
      }
    }
    if (event.type === "email.received" && event.data?.from) {
      await updateRepresentativeContact(String(event.data.from).toLowerCase(), "replied");
    }

    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error("[Resend Webhook] Error:", error);
    return res.status(500).json({ received: false, error: "Processing error" });
  }
});

export default router;
