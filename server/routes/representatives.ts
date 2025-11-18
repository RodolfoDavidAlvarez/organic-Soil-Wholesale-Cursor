import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// Download contact card (vCard) - supports both representatives and admins
router.get("/:slug/contact-card", async (req, res) => {
  try {
    const { slug } = req.params;

    // Try representatives first
    let { data, error } = await supabase
      .from("representatives")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    // If not found, try admin_users
    if (error && error.code === "PGRST116") {
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("slug", slug)
        .eq("has_landing_page", true)
        .eq("is_active", true)
        .single();

      if (adminError) {
        if (adminError.code === "PGRST116") {
          return res.status(404).json({ error: "Contact not found" });
        }
        throw adminError;
      }

      if (!adminData) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // Transform admin data
      data = {
        name: adminData.full_name || adminData.email,
        email: adminData.email,
        phone: adminData.phone,
        website: adminData.website,
        company_name: adminData.company_name,
        title: adminData.title,
        address: adminData.address,
        city: adminData.city,
        state: adminData.state,
        zip_code: adminData.zip_code,
        photo_url: adminData.photo_url,
        slug: adminData.slug,
      };
    } else if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Contact not found" });
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
      `attachment; filename="${data.slug || "contact"}.vcf"`
    );
    return res.send(vcard);
  } catch (error: any) {
    console.error("Error generating contact card:", error);
    res.status(500).json({ error: error.message || "Failed to generate contact card" });
  }
});

// Get a representative or admin by slug (public route)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Try to find in representatives table first
    let { data, error } = await supabase
      .from("representatives")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    // If not found in representatives, check admin_users
    if (error && (error.code === "PGRST116" || error.code === "42P01")) {
      // PGRST116 = not found, 42P01 = table doesn't exist (fallback)
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("slug", slug)
        .eq("has_landing_page", true)
        .eq("is_active", true)
        .single();

      if (adminError) {
        if (adminError.code === "PGRST116") {
          return res.status(404).json({ error: "Landing page not found" });
        }
        console.error("Error fetching admin landing page:", adminError);
        throw adminError;
      }

      if (!adminData) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      // Transform admin data to match representative format
      data = {
        id: adminData.id,
        slug: adminData.slug,
        name: adminData.full_name || adminData.email,
        email: adminData.email,
        phone: adminData.phone,
        website: adminData.website,
        bio: adminData.bio,
        photo_url: adminData.photo_url,
        banner_image_url: adminData.banner_image_url,
        gallery_images: adminData.gallery_images || [],
        video_urls: adminData.video_urls || [],
        company_name: adminData.company_name,
        title: adminData.title,
        address: adminData.address,
        city: adminData.city,
        state: adminData.state,
        zip_code: adminData.zip_code,
        social_links: adminData.social_links || {},
        contact_button_text: adminData.contact_button_text || "Enter Your Contact Details",
        contact_card_button_text: adminData.contact_card_button_text || "Download Contact Card",
        contact_form_title: adminData.contact_form_title || "Get In Touch",
        contact_form_description: adminData.contact_form_description,
        is_active: adminData.is_active,
        source: "admin", // Flag to indicate this is from admin_users
      };
    } else if (error) {
      // If there's an error other than "not found", log it and try admin_users as fallback
      console.error("Error fetching representative:", error);
      
      // Try admin_users as fallback
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("slug", slug)
        .eq("has_landing_page", true)
        .eq("is_active", true)
        .single();

      if (adminError) {
        if (adminError.code === "PGRST116") {
          return res.status(404).json({ error: "Landing page not found" });
        }
        throw adminError;
      }

      if (adminData) {
        // Transform admin data to match representative format
        data = {
          id: adminData.id,
          slug: adminData.slug,
          name: adminData.full_name || adminData.email,
          email: adminData.email,
          phone: adminData.phone,
          website: adminData.website,
          bio: adminData.bio,
          photo_url: adminData.photo_url,
          banner_image_url: adminData.banner_image_url,
          gallery_images: adminData.gallery_images || [],
          video_urls: adminData.video_urls || [],
          company_name: adminData.company_name,
          title: adminData.title,
          address: adminData.address,
          city: adminData.city,
          state: adminData.state,
          zip_code: adminData.zip_code,
          social_links: adminData.social_links || {},
          contact_button_text: adminData.contact_button_text || "Enter Your Contact Details",
          contact_card_button_text: adminData.contact_card_button_text || "Download Contact Card",
          contact_form_title: adminData.contact_form_title || "Get In Touch",
          contact_form_description: adminData.contact_form_description,
          is_active: adminData.is_active,
          source: "admin",
        };
      } else {
        throw error;
      }
    }

    if (!data) {
      return res.status(404).json({ error: "Landing page not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error fetching landing page:", error);
    res.status(500).json({ error: error.message || "Failed to fetch landing page" });
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

    // Try to find in representatives first
    const { data: representative, error: repError } = await supabase
      .from("representatives")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    let contactData: any = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      company_name: companyName || null,
      message: message || null,
      source: "landing_page",
      status: "new",
    };

    if (representative && !repError) {
      // Found in representatives table - get the full representative to access admin_id
      const { data: fullRep, error: fullRepError } = await supabase
        .from("representatives")
        .select("id, admin_id")
        .eq("id", representative.id)
        .single();

      if (!fullRepError && fullRep) {
        contactData.representative_id = fullRep.id;
        contactData.admin_id = fullRep.admin_id || null; // Link to admin if representative has one
      } else {
        contactData.representative_id = representative.id;
        contactData.admin_id = null;
      }
    } else {
      // Try to find in admin_users
      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("slug", slug)
        .eq("has_landing_page", true)
        .eq("is_active", true)
        .single();

      if (adminError || !admin) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      // Found in admin_users table
      contactData.admin_id = admin.id;
      contactData.representative_id = null;
    }

    // Insert contact submission
    const { data, error } = await supabase
      .from("representative_contacts")
      .insert(contactData)
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
