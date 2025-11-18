import { Router } from "express";
import bcrypt from "bcrypt";
import { supabase } from "../../supabaseClient";
import { createAdminToken, adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";

const router = Router();

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get admin user
    const { data: admin, error } = await supabase.from("admin_users").select("*").eq("email", email).single();

    if (error || !admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    if (!admin.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create token
    const token = createAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Create initial admin user (should be run once)
router.post("/create-admin", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Check if any admin exists
    const { count } = await supabase.from("admin_users").select("*", { count: "exact", head: true });

    if (count && count > 0) {
      // Only allow if authenticated as admin
      if (!req.headers.authorization) {
        return res.status(403).json({ error: "Admin already exists" });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create admin
    const { data: newAdmin, error } = await supabase
      .from("admin_users")
      .insert({
        email,
        password_hash,
        full_name,
        role: "admin",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

// Validate token
router.get("/validate", adminAuthMiddleware, async (req: AdminRequest, res) => {
  if (req.admin) {
    // Get full admin details from database
    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, permissions")
      .eq("id", req.admin.id)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: "Admin not found" });
    }

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        permissions: admin.permissions || {},
      },
    });
  } else {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get admin contact card data
router.get("/contact-card", adminAuthMiddleware, async (req: AdminRequest, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select(
        "id, email, full_name, slug, phone, bio, photo_url, banner_image_url, gallery_images, video_urls, company_name, title, address, city, state, zip_code, website, social_links, contact_button_text, contact_card_button_text, contact_form_title, contact_form_description, has_landing_page"
      )
      .eq("id", req.admin.id)
      .single();

    if (error) {
      throw error;
    }

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(admin);
  } catch (error: any) {
    console.error("Error fetching admin contact card:", error);
    res.status(500).json({ error: error.message || "Failed to fetch contact card" });
  }
});

// Update admin profile (admins can update their own profile)
router.patch("/profile", adminAuthMiddleware, async (req: AdminRequest, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { full_name } = req.body;

    // Only allow updating full_name for now (basic profile info)
    const updateData: any = {};
    if (full_name !== undefined) {
      updateData.full_name = full_name || null;
    }

    // Update admin profile
    const { data: updatedAdmin, error } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", req.admin.id)
      .select("id, email, full_name, role")
      .single();

    if (error) {
      throw error;
    }

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error: any) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

// Update admin contact card (admins can update their own contact card)
router.patch("/contact-card", adminAuthMiddleware, async (req: AdminRequest, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      slug,
      phone,
      bio,
      photo_url,
      banner_image_url,
      gallery_images,
      video_urls,
      company_name,
      title,
      address,
      city,
      state,
      zip_code,
      website,
      social_links,
      contact_button_text,
      contact_card_button_text,
      contact_form_title,
      contact_form_description,
      has_landing_page,
    } = req.body;

    // Get current admin to check slug uniqueness
    const { data: currentAdmin, error: fetchError } = await supabase
      .from("admin_users")
      .select("id, slug")
      .eq("id", req.admin.id)
      .single();

    if (fetchError || !currentAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== currentAdmin.slug) {
      // Check in representatives table
      const { data: repExists } = await supabase.from("representatives").select("id").eq("slug", slug).single();
      if (repExists) {
        return res.status(400).json({ error: "A contact card with this slug already exists" });
      }

      // Check in admin_users table
      const { data: adminExists } = await supabase.from("admin_users").select("id").eq("slug", slug).single();
      if (adminExists && adminExists.id !== req.admin.id) {
        return res.status(400).json({ error: "A contact card with this slug already exists" });
      }
    }

    const updateData: any = {};
    if (slug !== undefined) updateData.slug = slug || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (banner_image_url !== undefined) updateData.banner_image_url = banner_image_url || null;
    if (gallery_images !== undefined) {
      updateData.gallery_images = Array.isArray(gallery_images) ? gallery_images.filter((url: string) => !!url) : [];
    }
    if (video_urls !== undefined) {
      updateData.video_urls = Array.isArray(video_urls) ? video_urls.filter((url: string) => !!url?.trim()) : [];
    }
    if (company_name !== undefined) updateData.company_name = company_name || null;
    if (title !== undefined) updateData.title = title || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (zip_code !== undefined) updateData.zip_code = zip_code || null;
    if (website !== undefined) updateData.website = website || null;
    if (social_links !== undefined) updateData.social_links = social_links || {};
    if (contact_button_text !== undefined) updateData.contact_button_text = contact_button_text || "Contact Me";
    if (contact_card_button_text !== undefined)
      updateData.contact_card_button_text = contact_card_button_text || "Download Contact Card";
    if (contact_form_title !== undefined) updateData.contact_form_title = contact_form_title || "Get In Touch";
    if (contact_form_description !== undefined) updateData.contact_form_description = contact_form_description || null;
    if (has_landing_page !== undefined) updateData.has_landing_page = has_landing_page || false;

    // Update admin contact card
    const { data: updatedAdmin, error } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", req.admin.id)
      .select(
        "id, email, full_name, slug, phone, bio, photo_url, banner_image_url, gallery_images, video_urls, company_name, title, address, city, state, zip_code, website, social_links, contact_button_text, contact_card_button_text, contact_form_title, contact_form_description, has_landing_page"
      )
      .single();

    if (error) {
      throw error;
    }

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({
      message: "Contact card updated successfully",
      admin: updatedAdmin,
    });
  } catch (error: any) {
    console.error("Error updating admin contact card:", error);
    res.status(500).json({ error: error.message || "Failed to update contact card" });
  }
});

// Test endpoint to check password
router.post("/test-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get admin user
    const { data: admin, error } = await supabase.from("admin_users").select("email, password_hash, role").eq("email", email).single();

    if (error || !admin) {
      return res.json({
        found: false,
        error: error?.message || "User not found",
      });
    }

    // Test password
    const testHash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, admin.password_hash);

    res.json({
      found: true,
      email: admin.email,
      hasPasswordHash: !!admin.password_hash,
      passwordHashLength: admin.password_hash?.length || 0,
      passwordValid: isValid,
      testInfo: {
        inputPassword: password,
        inputLength: password.length,
        hashStartsWith: admin.password_hash?.substring(0, 7),
        testHashStartsWith: testHash.substring(0, 7),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
