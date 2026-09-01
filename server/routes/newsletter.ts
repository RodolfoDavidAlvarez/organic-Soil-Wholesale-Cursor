import { Router } from "express";
import { Resend } from "resend";
import { supabase } from "../supabaseClient";
import { subscribeNewsletterContact } from "../../shared/newsletterEngagement.js";
import { getNewsletterAdminRecipients, isGardenClassRegistrationSource, sendNewsletterAdminNotifications } from "../../shared/newsletterNotifications.js";
import { submitGardenClassRegistration } from "../../shared/workshopRegistrations.js";
import {
  isWormCastingsCampaignSource,
  WORM_CASTINGS_CAMPAIGN_ENDED_MESSAGE,
  WORM_CASTINGS_PUBLIC_SIGNUP_OPEN,
} from "../../shared/wormCastingsCampaign.js";
import { validateWormCastingsRouting } from "../../shared/wormCastingsRouting.js";

const router = Router();

router.post("/subscribe", async (req, res) => {
  const { email, name, phone, customerCategory, consent, website, source, campaign } = req.body || {};
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const normalizedPhone = String(phone || "").trim();
  const normalizedSource = String(source || "website_newsletter_signup").slice(0, 100);
  const campaignRequested = campaign === "free-worm-castings-2026-08" || isWormCastingsCampaignSource(source);
  if (campaignRequested && !WORM_CASTINGS_PUBLIC_SIGNUP_OPEN) {
    return res.status(410).json({
      error: WORM_CASTINGS_CAMPAIGN_ENDED_MESSAGE,
      campaignEnded: true,
    });
  }
  const allowedCustomerCategories = new Set(["home-gardener", "farmer", "landscaper", "nursery", "contractor", "municipal-commercial", "other"]);
  let routing = null;
  let normalizedCustomerCategory = String(customerCategory || "").trim();

  if (website) return res.json({ success: true });
  if (isGardenClassRegistrationSource(normalizedSource)) {
    try {
      const result = await submitGardenClassRegistration({
        db: supabase,
        input: {
          name,
          email: normalizedEmail,
          phone: normalizedPhone,
          customerCategory,
          source: normalizedSource,
          eventUpdatesConsent: true,
          marketingConsent: Boolean(consent),
          website,
        },
        subscribeNewsletterContact,
        resend: process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null,
      });
      if (!result.ok) return res.status(result.status || 400).json({ error: result.error });
      if (result.bot) return res.json({ success: true });
      return res.json({ success: true, message: "You're subscribed." });
    } catch (error: any) {
      console.error("[Workshop RSVP] Error:", error?.message || error);
      return res.status(500).json({ error: "We could not save your RSVP. Please try again." });
    }
  }
  if (!consent) return res.status(400).json({ error: "Please confirm that you want to receive emails." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (normalizedPhone.replace(/\D/g, "").length < 10 || normalizedPhone.length > 30) {
    return res.status(400).json({ error: "Please enter a valid phone number." });
  }
  if (campaignRequested) {
    const validated = validateWormCastingsRouting(req.body || {});
    if (!validated.ok) return res.status(400).json({ error: validated.error });
    routing = validated.routing;
    normalizedCustomerCategory = routing.customerType;
  } else if (!allowedCustomerCategories.has(normalizedCustomerCategory)) {
    return res.status(400).json({ error: "Please select the option that best describes you." });
  }

  try {
    const result = await subscribeNewsletterContact(supabase, {
      email: normalizedEmail,
      name,
      phone: normalizedPhone,
      customerCategory: normalizedCustomerCategory,
      source: String(source || "website_newsletter_signup").slice(0, 100),
      zipCode: routing?.zipCode,
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
            zipCode: routing?.zipCode,
            gardenStatus: routing?.gardenStatus,
            propertyProfile: routing?.propertyProfile,
            offer: routing?.offer,
            nextAction: routing?.nextAction,
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
