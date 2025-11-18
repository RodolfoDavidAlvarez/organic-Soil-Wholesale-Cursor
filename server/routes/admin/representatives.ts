import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";

const router = Router();

// Apply admin auth middleware to all routes
router.use(adminAuthMiddleware);

// Get all representatives
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("representatives")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error("Error fetching representatives:", error);
    res.status(500).json({ error: error.message || "Failed to fetch representatives" });
  }
});

// Get a single representative by ID
router.get("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.from("representatives").select("*").eq("id", id).single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Representative not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error fetching representative:", error);
    res.status(500).json({ error: error.message || "Failed to fetch representative" });
  }
});

// Create a new representative
router.post("/", async (req: AdminRequest, res) => {
  try {
    const {
      slug,
      name,
      email,
      phone,
      website,
      bio,
      photoUrl,
      bannerImageUrl,
      galleryImages,
      companyName,
      title,
      address,
      city,
      state,
      zipCode,
      socialLinks,
      customFields,
      contactButtonText,
      contactCardButtonText,
      contactFormTitle,
      contactFormDescription,
      isActive,
      displayOrder,
    } = req.body;

    // Validate required fields
    if (!slug || !name || !email) {
      return res.status(400).json({ error: "Slug, name, and email are required" });
    }

    // Check if slug already exists
    const { data: existing } = await supabase.from("representatives").select("id").eq("slug", slug).single();

    if (existing) {
      return res.status(400).json({ error: "A representative with this slug already exists" });
    }

    const { data, error } = await supabase
      .from("representatives")
      .insert({
        slug,
        name,
        email,
        phone: phone || null,
        website: website || null,
        bio: bio || null,
        photo_url: photoUrl || null,
        banner_image_url: bannerImageUrl || null,
        gallery_images: Array.isArray(galleryImages) ? galleryImages.filter((url: string) => !!url) : [],
        company_name: companyName || null,
        title: title || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        social_links: socialLinks || {},
        custom_fields: customFields || {},
        contact_button_text: contactButtonText || "Contact Me",
        contact_card_button_text: contactCardButtonText || "Download Contact Card",
        contact_form_title: contactFormTitle || "Get In Touch",
        contact_form_description: contactFormDescription || null,
        is_active: isActive !== undefined ? isActive : true,
        display_order: displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error("Error creating representative:", error);
    res.status(500).json({ error: error.message || "Failed to create representative" });
  }
});

// Update a representative
router.put("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      name,
      email,
      phone,
      website,
      bio,
      photoUrl,
      bannerImageUrl,
      galleryImages,
      companyName,
      title,
      address,
      city,
      state,
      zipCode,
      socialLinks,
      customFields,
      contactButtonText,
      contactCardButtonText,
      contactFormTitle,
      contactFormDescription,
      isActive,
      displayOrder,
    } = req.body;

    // Check if representative exists
    const { data: existing } = await supabase.from("representatives").select("id, slug").eq("id", id).single();

    if (!existing) {
      return res.status(404).json({ error: "Representative not found" });
    }

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== existing.slug) {
      const { data: slugExists } = await supabase.from("representatives").select("id").eq("slug", slug).single();

      if (slugExists) {
        return res.status(400).json({ error: "A representative with this slug already exists" });
      }
    }

    const updateData: any = {};
    if (slug !== undefined) updateData.slug = slug;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (bio !== undefined) updateData.bio = bio;
    if (photoUrl !== undefined) updateData.photo_url = photoUrl;
    if (bannerImageUrl !== undefined) updateData.banner_image_url = bannerImageUrl;
    if (galleryImages !== undefined) {
      updateData.gallery_images = Array.isArray(galleryImages) ? galleryImages.filter((url: string) => !!url) : [];
    }
    if (companyName !== undefined) updateData.company_name = companyName;
    if (title !== undefined) updateData.title = title;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zip_code = zipCode;
    if (socialLinks !== undefined) updateData.social_links = socialLinks;
    if (customFields !== undefined) updateData.custom_fields = customFields;
    if (contactButtonText !== undefined) updateData.contact_button_text = contactButtonText;
    if (contactCardButtonText !== undefined) updateData.contact_card_button_text = contactCardButtonText;
    if (contactFormTitle !== undefined) updateData.contact_form_title = contactFormTitle;
    if (contactFormDescription !== undefined) updateData.contact_form_description = contactFormDescription;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (displayOrder !== undefined) updateData.display_order = displayOrder;

    const { data, error } = await supabase.from("representatives").update(updateData).eq("id", id).select().single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("Error updating representative:", error);
    res.status(500).json({ error: error.message || "Failed to update representative" });
  }
});

// Delete a representative
router.delete("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("representatives").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Representative deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting representative:", error);
    res.status(500).json({ error: error.message || "Failed to delete representative" });
  }
});

// Get contacts for a representative
router.get("/:id/contacts", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let query = supabase.from("representative_contacts").select("*").eq("representative_id", id).order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: error.message || "Failed to fetch contacts" });
  }
});

// Update contact status
router.patch("/contacts/:contactId", async (req: AdminRequest, res) => {
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
    console.error("Error updating contact:", error);
    res.status(500).json({ error: error.message || "Failed to update contact" });
  }
});

export default router;
