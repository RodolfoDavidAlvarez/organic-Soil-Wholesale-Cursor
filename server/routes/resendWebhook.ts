/**
 * Resend Webhook Handler
 * Receives events for: email opened, clicked, bounced, delivered, and inbound replies
 */

import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// Webhook event types from Resend
interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string | string[];
    subject?: string;
    // For inbound emails
    html?: string;
    text?: string;
    reply_to?: string;
  };
}

/**
 * POST /api/resend/webhook
 * Receives webhook events from Resend
 */
router.post("/webhook", async (req, res) => {
  try {
    const event: ResendWebhookEvent = req.body;

    console.log("[Resend Webhook] Received:", event.type);
    console.log("[Resend Webhook] Data:", JSON.stringify(event.data, null, 2));

    switch (event.type) {
      case "email.sent":
        console.log("[Resend] Email sent:", event.data.email_id);
        break;

      case "email.delivered":
        console.log("[Resend] Email delivered to:", event.data.to);
        await updateEmailStatus(event.data.to, "delivered");
        break;

      case "email.opened":
        console.log("[Resend] Email opened by:", event.data.to);
        await updateEmailStatus(event.data.to, "opened");
        await incrementOpenCount(event.data.to);
        break;

      case "email.clicked":
        console.log("[Resend] Link clicked by:", event.data.to);
        await updateEmailStatus(event.data.to, "clicked");
        break;

      case "email.bounced":
        console.log("[Resend] Email bounced:", event.data.to);
        await updateEmailStatus(event.data.to, "bounced");
        break;

      case "email.complained":
        console.log("[Resend] Spam complaint from:", event.data.to);
        await updateEmailStatus(event.data.to, "spam_complaint");
        break;

      // Inbound email (reply detection)
      case "email.received":
        console.log("[Resend] Inbound email received from:", event.data.from);
        await handleInboundReply(event.data);
        break;

      default:
        console.log("[Resend] Unknown event type:", event.type);
    }

    // Always respond 200 OK to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Resend Webhook] Error:", error);
    // Still return 200 to prevent retries for processing errors
    res.status(200).json({ received: true, error: "Processing error" });
  }
});

/**
 * Update contact email status in database
 */
async function updateEmailStatus(email: string | string[] | undefined, status: string) {
  if (!email) return;

  const emailAddress = Array.isArray(email) ? email[0] : email;

  try {
    const { error } = await supabase
      .from("representative_contacts")
      .update({
        email_status: status,
        email_status_updated_at: new Date().toISOString(),
      })
      .eq("email", emailAddress.toLowerCase());

    if (error) {
      console.error("[Resend] Failed to update status:", error);
    } else {
      console.log("[Resend] Updated status for", emailAddress, "to", status);
    }
  } catch (err) {
    console.error("[Resend] Error updating status:", err);
  }
}

/**
 * Increment email open count
 */
async function incrementOpenCount(email: string | string[] | undefined) {
  if (!email) return;

  const emailAddress = Array.isArray(email) ? email[0] : email;

  try {
    // Get current count
    const { data: contact } = await supabase
      .from("representative_contacts")
      .select("email_opens")
      .eq("email", emailAddress.toLowerCase())
      .single();

    const currentOpens = contact?.email_opens || 0;

    // Increment
    await supabase
      .from("representative_contacts")
      .update({ email_opens: currentOpens + 1 })
      .eq("email", emailAddress.toLowerCase());

  } catch (err) {
    console.error("[Resend] Error incrementing opens:", err);
  }
}

/**
 * Handle inbound reply - pause any sequences, update status
 */
async function handleInboundReply(data: ResendWebhookEvent["data"]) {
  const fromEmail = data.from;
  if (!fromEmail) return;

  console.log("[Resend] Reply detected from:", fromEmail);
  console.log("[Resend] Subject:", data.subject);
  console.log("[Resend] Body preview:", data.text?.substring(0, 200));

  try {
    // Update contact status to "replied"
    const { error } = await supabase
      .from("representative_contacts")
      .update({
        status: "replied",
        email_status: "replied",
        replied_at: new Date().toISOString(),
        // Pause any email sequences
        sequence_status: "paused",
      })
      .eq("email", fromEmail.toLowerCase());

    if (error) {
      console.error("[Resend] Failed to update reply status:", error);
    } else {
      console.log("[Resend] Contact marked as replied:", fromEmail);
    }

    // TODO: Optionally store the reply content
    // TODO: Optionally notify via Slack/email

  } catch (err) {
    console.error("[Resend] Error handling reply:", err);
  }
}

export default router;
