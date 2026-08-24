import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import { listSurveyInbox } from "../../../shared/surveyResponses.js";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", async (req, res) => {
  try {
    const inbox = await listSurveyInbox(supabase, {
      kind: String(req.query.kind || "all"),
      limit: req.query.limit,
    });
    return res.json(inbox);
  } catch (error: any) {
    console.error("[Admin surveys]", error?.message || error);
    return res.status(500).json({ error: "Could not load surveys." });
  }
});

export default router;
