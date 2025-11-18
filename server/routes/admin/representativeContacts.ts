import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", async (req: AdminRequest, res) => {
  try {
    const { status, search, representativeId } = req.query;

    let query = supabase.from("representative_contacts").select("*").order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (representativeId) {
      query = query.eq("representative_id", representativeId);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    const { data: contacts, error } = await query;

    if (error) throw error;

    const representativeIds = Array.from(new Set((contacts || []).map((contact) => contact.representative_id).filter(Boolean)));

    let representativesMap: Record<number, any> = {};

    if (representativeIds.length > 0) {
      const { data: reps, error: repsError } = await supabase
        .from("representatives")
        .select("id, name, slug, email, phone, photo_url")
        .in("id", representativeIds);

      if (repsError) throw repsError;

      representativesMap = (reps || []).reduce(
        (acc, rep) => {
          acc[rep.id] = rep;
          return acc;
        },
        {} as Record<number, any>
      );
    }

    const enriched = (contacts || []).map((contact) => ({
      ...contact,
      representative: representativesMap[contact.representative_id] || null,
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error("Error fetching representative contacts:", error);
    res.status(500).json({ error: error.message || "Failed to fetch contacts" });
  }
});

router.patch("/:contactId", async (req: AdminRequest, res) => {
  try {
    const { contactId } = req.params;
    const { status, notes } = req.body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase.from("representative_contacts").update(updateData).eq("id", contactId).select().single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("Error updating representative contact:", error);
    res.status(500).json({ error: error.message || "Failed to update contact" });
  }
});

export default router;
