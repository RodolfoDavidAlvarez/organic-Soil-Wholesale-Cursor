import { Router } from "express";
import { supabase } from "../supabaseClient";
import { saveSurveyResponse, validateSurveyResponse } from "../../shared/surveyResponses.js";

const router = Router();

router.post(["/", "/submit"], async (req, res) => {
  const validation = validateSurveyResponse(req.body || {}, {
    userAgent: String(req.headers["user-agent"] || ""),
  });
  if (!validation.ok) return res.status(400).json({ error: validation.error });
  if (validation.bot) return res.json({ success: true });

  try {
    const result = await saveSurveyResponse({
      db: supabase,
      response: validation.response,
    });
    return res.status(201).json({
      success: true,
      responseId: result.response.id,
      message: "Thank you. We read these.",
    });
  } catch (error: any) {
    console.error("[Survey] Error:", error?.message || error);
    return res.status(500).json({ error: "We could not save your answers. Please try again." });
  }
});

export default router;
