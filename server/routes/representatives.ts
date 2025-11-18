import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// Download contact card (vCard)
router.get("/:slug/contact-card", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from("representatives")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Representative not found" });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Representative not found" });
    }

    const [firstName, ...rest] = (data.name || "").split(" ");
    const lastName = rest.join(" ");

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName || data.name};;;`,
      `FN:${data.name}`,
      data.company_name ? `ORG:${data.company_name}` : null,
      data.title ? `TITLE:${data.title}` : null,
      data.email ? `EMAIL;TYPE=INTERNET:${data.email}` : null,
      data.phone ? `TEL;TYPE=CELL:${data.phone}` : null,
      data.website ? `URL:${data.website}` : null,
      data.address || data.city || data.state || data.zip_code
        ? `ADR;TYPE=WORK:;;${data.address || ""};${data.city || ""};${data.state || ""};${
            data.zip_code || ""
          };`
        : null,
      data.photo_url ? `PHOTO;VALUE=URI:${data.photo_url}` : null,
      "END:VCARD",
    ].filter(Boolean);

    const vcard = lines.join("\n");

    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.slug || "representative"}.vcf"`
    );
    return res.send(vcard);
  } catch (error: any) {
    console.error("Error generating contact card:", error);
    res.status(500).json({ error: error.message || "Failed to generate contact card" });
  }
});

// Get a representative by slug (public route)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from("representatives")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Representative not found" });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Representative not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error fetching representative:", error);
    res.status(500).json({ error: error.message || "Failed to fetch representative" });
  }
});

// Submit contact form (public route)
router.post("/:slug/contact", async (req, res) => {
  try {
    const { slug } = req.params;
    const { firstName, lastName, email, phone, companyName, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "First name, last name, and email are required" });
    }

    // Get representative ID
    const { data: representative, error: repError } = await supabase
      .from("representatives")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (repError || !representative) {
      return res.status(404).json({ error: "Representative not found" });
    }

    // Insert contact submission
    const { data, error } = await supabase
      .from("representative_contacts")
      .insert({
        representative_id: representative.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        company_name: companyName || null,
        message: message || null,
        source: "landing_page",
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ error: error.message || "Failed to submit contact form" });
  }
});

export default router;

