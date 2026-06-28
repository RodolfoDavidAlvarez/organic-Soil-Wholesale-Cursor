/**
 * Unsubscribe API Handler
 * Primary: sp_customers (Supabase). Legacy sync: Airtable Email Marketing 2026.
 */

import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = "appBLlRW7MOx0qdlu";
const AIRTABLE_TABLE_ID = "tblmofFGmkN2dZ4GB";

interface UnsubscribeRequest {
  email: string;
  reason?: string;
}

async function unsubscribeInSupabase(normalizedEmail: string, reason?: string) {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("sp_customers")
    .select("id, newsletter_notes")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (!existing) return { updated: false };

  const notes = reason?.trim()
    ? `${existing.newsletter_notes || ""}\n\n[Unsubscribed ${now}]\nReason: ${reason.trim()}`.trim()
    : existing.newsletter_notes;

  await supabase
    .from("sp_customers")
    .update({
      newsletter_subscribed: false,
      newsletter_unsubscribed_at: now,
      newsletter_notes: notes || null,
      updated_at: now,
    })
    .eq("id", existing.id);

  return { updated: true };
}

async function unsubscribeInAirtable(normalizedEmail: string, reason?: string) {
  if (!AIRTABLE_API_KEY) return;

  const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=LOWER({Email})="${normalizedEmail}"&maxRecords=1`;
  const searchResponse = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });
  if (!searchResponse.ok) return;

  const searchData = await searchResponse.json();
  const records = searchData.records || [];
  if (!records.length) return;

  const recordId = records[0].id;
  const updateFields: Record<string, unknown> = {
    Subscribed: false,
    "Unsubscribed Date": new Date().toISOString().split("T")[0],
  };

  if (reason?.trim()) {
    const existingNotes = records[0].fields?.Notes || "";
    updateFields.Notes = `${existingNotes}\n\n[Unsubscribed ${new Date().toISOString()}]\nReason: ${reason.trim()}`.trim();
  }

  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: updateFields }),
  });
}

router.post("/", async (req, res) => {
  try {
    const { email, reason }: UnsubscribeRequest = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();
    console.log("[Unsubscribe] Processing:", normalizedEmail);

    await unsubscribeInSupabase(normalizedEmail, reason);
    await unsubscribeInAirtable(normalizedEmail, reason).catch((e) =>
      console.warn("[Unsubscribe] Airtable sync failed:", e?.message),
    );

    res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/status/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const { data: customer } = await supabase
      .from("sp_customers")
      .select("newsletter_subscribed, newsletter_unsubscribed_at")
      .ilike("email", email)
      .maybeSingle();

    if (customer) {
      return res.json({
        found: true,
        subscribed: customer.newsletter_subscribed !== false,
        unsubscribedDate: customer.newsletter_unsubscribed_at || null,
        source: "sp_customers",
      });
    }

    res.json({ found: false });
  } catch (error) {
    console.error("[Unsubscribe] Status check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
