import { Router } from "express";
import { supabase } from "../supabaseClient";
import { subscribeNewsletterContact } from "../../shared/newsletterEngagement.js";
import { getNewsletterAdminRecipients, sendNewsletterAdminNotifications } from "../../shared/newsletterNotifications.js";

const router = Router();

router.post("/subscribe", async (req, res) => {
  const { email, name, phone, customerCategory, consent, website, source } = req.body || {};
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const normalizedPhone = String(phone || "").trim();
  const normalizedCustomerCategory = String(customerCategory || "").trim();
  const allowedCustomerCategories = new Set(["home-gardener", "farmer", "landscaper", "nursery", "contractor", "municipal-commercial", "other"]);

  if (website) return res.json({ success: true });
  if (!consent) return res.status(400).json({ error: "Please confirm that you want to receive emails." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (normalizedPhone.replace(/\D/g, "").length < 10 || normalizedPhone.length > 30) {
    return res.status(400).json({ error: "Please enter a valid phone number." });
  }
  if (!allowedCustomerCategories.has(normalizedCustomerCategory)) {
    return res.status(400).json({ error: "Please select the option that best describes you." });
  }

  try {
    const result = await subscribeNewsletterContact(supabase, {
      email: normalizedEmail,
      name,
      phone: normalizedPhone,
      customerCategory: normalizedCustomerCategory,
      source: String(source || "website_newsletter_signup").slice(0, 100),
    });

    if (result.status === "opted_out") {
      return res.status(409).json({
        error: "This address has a previous opt-out. Please contact us if you would like us to review it.",
      });
    }

    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const recipients = getNewsletterAdminRecipients();
        const notificationResults = await sendNewsletterAdminNotifications({
          resend,
          recipients,
          subscriber: {
            email: normalizedEmail,
            name,
            phone: normalizedPhone,
            customerCategory: normalizedCustomerCategory,
            source: String(source || "website_newsletter_signup").slice(0, 100),
            subscribedAt: new Date().toISOString(),
          },
        });
        notificationResults.forEach((notificationResult, index) => {
          if (notificationResult.status === "rejected") {
            console.error(`[Newsletter Subscribe] Admin notification to ${recipients[index]?.email} failed:`, notificationResult.reason?.message || notificationResult.reason);
          }
        });
      }
    } catch (notificationError: any) {
      console.error("[Newsletter Subscribe] Admin notification error:", notificationError?.message || notificationError);
    }

    return res.json({ success: true, message: "You're subscribed." });
  } catch (error: any) {
    console.error("[Newsletter Subscribe] Error:", error?.message || error);
    return res.status(500).json({ error: "We could not save your subscription. Please try again." });
  }
});

export default router;
