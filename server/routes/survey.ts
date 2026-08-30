import { Router } from "express";
import { supabase } from "../supabaseClient";
import { buildSurveyCouponQr, sendSurveyCouponQr } from "../../shared/surveyCouponQr.js";
import { processSurveySubmission } from "../../shared/surveyStaffAlerts.js";

const router = Router();

export async function handleSurveySubmit(req: any, res: any) {
  try {
    const result = await processSurveySubmission({
      db: supabase,
      body: req.body || {},
      userAgent: String(req.headers["user-agent"] || ""),
    });
    return res.status(result.status).json(result.json);
  } catch (error: any) {
    console.error("[Survey] Error:", error?.message || error);
    return res.status(500).json({ error: "We could not save your answers. Please try again." });
  }
}

router.post(["/", "/submit"], handleSurveySubmit);

export async function handleSurveyCouponQr(req: any, res: any) {
  try {
    const result = await buildSurveyCouponQr({
      db: supabase,
      fileName: req.params.file || `${req.params.code}.${req.params.format}`,
    });
    return sendSurveyCouponQr(res, result);
  } catch (error: any) {
    console.error("[Survey] Coupon QR error:", error?.message || error);
    return res.status(500).send("Could not build coupon QR");
  }
}

export default router;
