/**
 * Unsubscribe API Handler
 * Handles email unsubscribe requests and updates:
 * 1. Airtable Email Marketing 2026 database
 * 2. Logs the unsubscribe reason (optional)
 */

import { Router } from "express";

const router = Router();

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = "appBLlRW7MOx0qdlu"; // Email Marketing 2026
const AIRTABLE_TABLE_ID = "tblmofFGmkN2dZ4GB";

interface UnsubscribeRequest {
  email: string;
  reason?: string;
}

/**
 * POST /api/unsubscribe
 * Unsubscribes an email from the marketing list
 */
router.post("/", async (req, res) => {
  try {
    const { email, reason }: UnsubscribeRequest = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("[Unsubscribe] Processing request for:", normalizedEmail);

    // Step 1: Find the contact in Airtable
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=LOWER({Email})="${normalizedEmail}"&maxRecords=1`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!searchResponse.ok) {
      console.error("[Unsubscribe] Airtable search failed:", await searchResponse.text());
      return res.status(500).json({ error: "Database error" });
    }

    const searchData = await searchResponse.json();
    const records = searchData.records || [];

    if (records.length === 0) {
      // Email not found - still return success (don't reveal if email exists)
      console.log("[Unsubscribe] Email not found in database:", normalizedEmail);
      return res.json({ success: true, message: "Unsubscribed successfully" });
    }

    const recordId = records[0].id;

    // Step 2: Update the contact - mark as unsubscribed
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`;

    const updateFields: Record<string, any> = {
      Subscribed: false,
      "Unsubscribed Date": new Date().toISOString().split("T")[0],
    };

    // Add unsubscribe reason to Notes if provided
    if (reason && reason.trim()) {
      const existingNotes = records[0].fields?.Notes || "";
      const timestamp = new Date().toISOString();
      updateFields.Notes = `${existingNotes}\n\n[Unsubscribed ${timestamp}]\nReason: ${reason.trim()}`.trim();
    }

    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: updateFields }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("[Unsubscribe] Airtable update failed:", errorText);

      // If field doesn't exist, try without Subscribed field
      if (errorText.includes("UNKNOWN_FIELD_NAME")) {
        console.log("[Unsubscribe] Retrying without Subscribed field...");

        const retryFields: Record<string, any> = {
          "Unsubscribed Date": new Date().toISOString().split("T")[0],
        };
        if (reason && reason.trim()) {
          const existingNotes = records[0].fields?.Notes || "";
          const timestamp = new Date().toISOString();
          retryFields.Notes = `${existingNotes}\n\n[Unsubscribed ${timestamp}]\nReason: ${reason.trim()}`.trim();
        }

        const retryResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: retryFields }),
        });

        if (!retryResponse.ok) {
          console.error("[Unsubscribe] Retry also failed:", await retryResponse.text());
          return res.status(500).json({ error: "Failed to update subscription status" });
        }
      } else {
        return res.status(500).json({ error: "Failed to update subscription status" });
      }
    }

    console.log("[Unsubscribe] Successfully unsubscribed:", normalizedEmail);
    res.json({ success: true, message: "Unsubscribed successfully" });

  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/unsubscribe/status/:email
 * Check subscription status (for debugging)
 */
router.get("/status/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=LOWER({Email})="${email}"&maxRecords=1`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Database error" });
    }

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) {
      return res.json({ found: false });
    }

    const record = records[0];
    res.json({
      found: true,
      subscribed: record.fields?.Subscribed !== false,
      unsubscribedDate: record.fields?.["Unsubscribed Date"] || null,
    });

  } catch (error) {
    console.error("[Unsubscribe] Status check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
