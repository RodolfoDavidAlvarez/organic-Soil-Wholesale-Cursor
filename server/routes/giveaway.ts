import { Router } from "express";
import { supabase } from "../supabaseClient";
import { processGiveawayEntry } from "../../shared/giveawayEntries.js";

const router = Router();

export async function handleGiveawayEnter(req: any, res: any) {
  try {
    const result = await processGiveawayEntry({
      db: supabase,
      body: req.body || {},
      userAgent: String(req.headers["user-agent"] || ""),
    });
    return res.status(result.status).json(result.json);
  } catch (error: any) {
    console.error("[Giveaway] Error:", error?.message || error);
    return res.status(500).json({ error: "We could not save your entry. Please try again." });
  }
}

router.post("/enter", handleGiveawayEnter);

export default router;
