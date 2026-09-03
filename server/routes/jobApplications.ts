import { Router } from "express";
import { Resend } from "resend";
import { supabase } from "../supabaseClient.js";
import {
  JOB_APPLICATION_BUCKET,
  JobApplicationError,
  cleanupUnsavedJobApplication,
  processJobApplication,
  validateJobApplicationUpload,
} from "../../shared/jobApplications.js";

const router = Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

router.post("/upload-url", async (req, res) => {
  try {
    const document = validateJobApplicationUpload(req.body || {});
    const { data, error } = await supabase.storage.from(JOB_APPLICATION_BUCKET)
      .createSignedUploadUrl(document.path, { upsert: false });
    if (error || !data?.token) throw error || new Error("No upload token returned");
    return res.json({ path: document.path, token: data.token });
  } catch (error: any) {
    const known = error instanceof JobApplicationError;
    return res.status(known ? error.status : 500).json({
      error: known ? error.message : "We could not prepare the document upload. Please try again.",
      code: known ? error.code : "upload_url_failed",
    });
  }
});

router.post("/cleanup", async (req, res) => {
  try {
    return res.json(await cleanupUnsavedJobApplication({
      db: supabase,
      applicationId: req.body?.applicationId,
      positionSlug: req.body?.positionSlug,
    }));
  } catch (error: any) {
    const known = error instanceof JobApplicationError;
    return res.status(known ? error.status : 500).json({
      error: known ? error.message : "Document cleanup failed.",
      code: known ? error.code : "cleanup_failed",
    });
  }
});

router.post("/", async (req, res) => {
  if (!resend) return res.status(503).json({ error: "Application email service is not configured." });
  try {
    const result = await processJobApplication({ db: supabase, resend, body: req.body || {} });
    return res.status(201).json(result);
  } catch (error: any) {
    const known = error instanceof JobApplicationError;
    let applicationWasSaved = false;
    try {
      await cleanupUnsavedJobApplication({
        db: supabase,
        applicationId: req.body?.applicationId,
        positionSlug: req.body?.positionSlug,
      });
    } catch (cleanupError: any) {
      if (cleanupError?.code === "application_saved") applicationWasSaved = true;
      else console.error("[Job Applications] Cleanup error:", cleanupError?.message || cleanupError);
    }
    console.error("[Job Applications] Submission error:", error?.message || error);
    return res.status(applicationWasSaved ? 502 : known ? error.status : 500).json({
      error: applicationWasSaved
        ? "Your application was saved, but a confirmation could not be delivered. Please try once more."
        : known ? error.message : "We could not submit your application. Please try again.",
      code: applicationWasSaved ? "notification_failed" : known ? error.code : "application_failed",
    });
  }
});

export default router;
