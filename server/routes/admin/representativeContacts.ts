import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", async (req: AdminRequest, res) => {
  try {
    const { status, search, representativeId, segment, partner_owner, lead_source } = req.query;

    let query = supabase.from("representative_contacts").select("*").order("created_at", { ascending: false });

    // Role-based filtering: Regular admins only see their own contacts
    if (req.admin?.role !== "super_admin") {
      // Get all representatives (contact cards) linked to this admin
      const { data: linkedReps, error: repsError } = await supabase.from("representatives").select("id").eq("admin_id", req.admin.id);

      if (repsError) throw repsError;

      const repIds = (linkedReps || []).map((r) => r.id);

      if (repIds.length > 0) {
        // Show contacts from this admin's contact cards OR direct admin_id matches
        // PostgREST syntax: or(condition1,condition2)
        const repIdFilter = repIds.map((id) => `representative_id.eq.${id}`).join(",");
        query = query.or(`${repIdFilter},admin_id.eq.${req.admin.id}`);
      } else {
        // No contact cards linked, only show direct admin_id matches
        query = query.eq("admin_id", req.admin.id);
      }
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (representativeId) {
      query = query.eq("representative_id", representativeId);
    }

    if (segment) {
      query = query.eq("segment", segment);
    }

    if (partner_owner) {
      query = query.eq("partner_owner", partner_owner);
    }

    if (lead_source) {
      query = query.eq("lead_source", lead_source);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    const { data: contacts, error } = await query;

    if (error) throw error;

    // Get representative IDs and admin IDs for enrichment
    const representativeIds = Array.from(new Set((contacts || []).map((contact) => contact.representative_id).filter(Boolean)));
    const adminIds = Array.from(new Set((contacts || []).map((contact) => contact.admin_id).filter(Boolean)));

    let representativesMap: Record<number, any> = {};
    let adminsMap: Record<number, any> = {};

    // Fetch representatives
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

    // Fetch admins
    if (adminIds.length > 0) {
      const { data: admins, error: adminsError } = await supabase
        .from("admin_users")
        .select("id, email, full_name, phone, photo_url, slug")
        .in("id", adminIds);

      if (adminsError) throw adminsError;

      adminsMap = (admins || []).reduce(
        (acc, admin) => {
          acc[admin.id] = admin;
          return acc;
        },
        {} as Record<number, any>
      );
    }

    // Enrich contacts with both representative and admin info
    const enriched = (contacts || []).map((contact) => ({
      ...contact,
      representative: contact.representative_id ? representativesMap[contact.representative_id] || null : null,
      admin: contact.admin_id ? adminsMap[contact.admin_id] || null : null,
      source: contact.admin_id ? "admin" : "representative",
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

    // Verify ownership: regular admins can only update their own contacts
    if (req.admin?.role !== "super_admin") {
      const { data: contact, error: fetchError } = await supabase
        .from("representative_contacts")
        .select("admin_id")
        .eq("id", contactId)
        .single();

      if (fetchError || !contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (contact.admin_id !== req.admin?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

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

// Bulk delete contacts
router.post("/bulk-delete", async (req: AdminRequest, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No contact IDs provided" });
    }

    // Verify ownership: regular admins can only delete their own contacts
    if (req.admin?.role !== "super_admin") {
      // Fetch all contacts to verify ownership
      const { data: contacts, error: fetchError } = await supabase
        .from("representative_contacts")
        .select("id, admin_id")
        .in("id", ids);

      if (fetchError) {
        throw fetchError;
      }

      // Check if any contact doesn't belong to this admin
      const unauthorizedContact = contacts?.find(
        (contact) => contact.admin_id !== req.admin?.id
      );

      if (unauthorizedContact) {
        return res.status(403).json({
          error: "Access denied. You can only delete your own contacts."
        });
      }
    }

    const { error } = await supabase
      .from("representative_contacts")
      .delete()
      .in("id", ids);

    if (error) throw error;

    res.json({ success: true, deletedCount: ids.length });
  } catch (error: any) {
    console.error("Error bulk deleting contacts:", error);
    res.status(500).json({ error: error.message || "Failed to delete contacts" });
  }
});

export default router;
