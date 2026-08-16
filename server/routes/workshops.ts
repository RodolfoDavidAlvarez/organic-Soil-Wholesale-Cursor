import { Router } from "express";
import { Resend } from "resend";
import { supabase } from "../supabaseClient";
import { subscribeNewsletterContact } from "../../shared/newsletterEngagement.js";
import {
  saveWorkshopRegistration,
  sendWorkshopAdminNotification,
  validateWorkshopRegistration,
} from "../../shared/workshopRegistrations.js";

const router = Router();

router.post("/fall-garden/register", async (req, res) => {
  const validation = validateWorkshopRegistration(req.body || {});
  if (!validation.ok) return res.status(400).json({ error: validation.error });
  if (validation.bot) return res.json({ success: true });

  try {
    const result = await saveWorkshopRegistration({
      db: supabase,
      registration: validation.registration,
      subscribeNewsletterContact,
    });

    let notificationStatus = result.registration.admin_notification_status;
    if (result.created) {
      try {
        const notification = await sendWorkshopAdminNotification({
          db: supabase,
          resend: process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null,
          registration: result.registration,
        });
        notificationStatus = notification.status;
      } catch (notificationError: any) {
        notificationStatus = "failed";
        console.error("[Workshop RSVP] Admin notification error:", notificationError?.message || notificationError);
      }
    }

    return res.status(result.created ? 201 : 200).json({
      success: true,
      registrationId: result.registration.id,
      alreadyRegistered: !result.created,
      marketingStatus: result.marketingSyncStatus,
      notificationStatus,
      message: result.created ? "Your workshop spot is saved." : "Your workshop RSVP is already saved.",
    });
  } catch (error: any) {
    console.error("[Workshop RSVP] Error:", error?.message || error);
    return res.status(500).json({ error: "We could not save your RSVP. Please try again." });
  }
});

export default router;
