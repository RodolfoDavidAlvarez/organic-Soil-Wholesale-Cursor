import { Router } from "express";
import { supabase } from "../supabaseClient";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for business card uploads
// Use client/public for static file serving compatibility
const uploadDir = path.join(process.cwd(), "client", "public", "uploads", "business-cards");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed."));
    }
  },
});

// Analyze business card using Grok Vision API
router.post("/:slug/analyze-business-card", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imagePath = `/uploads/business-cards/${req.file.filename}`;
    const fullPath = path.join(process.cwd(), "client", "public", imagePath);

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype;

    // Call Grok Vision API
    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-vision-1212",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: `Analyze this business card image and extract all contact information. Return ONLY a valid JSON object with these exact fields (use empty string "" for any field you cannot find):

{
  "firstName": "first name",
  "lastName": "last name",
  "email": "email address",
  "phone": "phone number",
  "companyName": "company or organization name",
  "title": "job title or position",
  "address": "full address if visible",
  "website": "website URL"
}

Important: Return ONLY the JSON object, no other text or markdown formatting.`,
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Grok API error:", error);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let extractedData;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return default empty values if parsing fails
      extractedData = {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        title: "",
        address: "",
        website: "",
      };
    }

    // Ensure all expected fields exist
    const defaultFields = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      title: "",
      address: "",
      website: "",
    };

    extractedData = { ...defaultFields, ...extractedData };

    res.json({
      success: true,
      extractedData,
      imagePath,
    });
  } catch (error: any) {
    console.error("Error analyzing business card:", error);
    res.status(500).json({ error: error.message || "Failed to analyze business card" });
  }
});

// Helper function to ensure a representative exists for an admin
async function ensureRepresentativeForAdmin(adminId: string): Promise<number | null> {
  // Check if a representative already exists for this admin
  const { data: existingRep } = await supabase
    .from("representatives")
    .select("id")
    .eq("admin_id", adminId)
    .single();

  if (existingRep) {
    return existingRep.id;
  }

  // Get admin details to create representative (including gallery and video data)
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, full_name, phone, photo_url, slug, title, bio, banner_image_url, gallery_images, video_urls, company_name, address, city, state, zip_code, social_links, contact_button_text, contact_card_button_text, contact_form_title, contact_form_description")
    .eq("id", adminId)
    .single();

  if (!admin) {
    return null;
  }

  // Create a representative entry for this admin with all relevant fields
  const { data: newRep, error } = await supabase
    .from("representatives")
    .insert({
      admin_id: adminId,
      name: admin.full_name || "Admin",
      email: admin.email,
      phone: admin.phone,
      photo_url: admin.photo_url,
      slug: admin.slug,
      title: admin.title || "Team Member",
      bio: admin.bio,
      banner_image_url: admin.banner_image_url,
      gallery_images: admin.gallery_images || [],
      video_urls: admin.video_urls || [],
      company_name: admin.company_name,
      address: admin.address,
      city: admin.city,
      state: admin.state,
      zip_code: admin.zip_code,
      social_links: admin.social_links || {},
      contact_button_text: admin.contact_button_text,
      contact_card_button_text: admin.contact_card_button_text,
      contact_form_title: admin.contact_form_title,
      contact_form_description: admin.contact_form_description,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating representative for admin:", error);
    return null;
  }

  return newRep?.id || null;
}

// Submit business card contact
router.post("/:slug/submit-business-card", upload.single("image"), async (req, res) => {
  try {
    const { slug } = req.params;
    const { firstName, lastName, email, phone, companyName, title, address, website } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

    // Get the image path if uploaded
    let businessCardImageUrl = null;
    if (req.file) {
      businessCardImageUrl = `/uploads/business-cards/${req.file.filename}`;
    }

    // Find the representative or admin by slug
    let adminId = null;
    let representativeId = null;

    // Try representatives first
    const { data: representative, error: repError } = await supabase
      .from("representatives")
      .select("id, admin_id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (representative && !repError) {
      representativeId = representative.id;
      adminId = representative.admin_id;
    } else {
      // Try admin_users
      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("slug", slug)
        .eq("has_landing_page", true)
        .eq("is_active", true)
        .single();

      if (admin && !adminError) {
        adminId = admin.id;
        // Auto-create a representative for this admin to satisfy the NOT NULL constraint
        representativeId = await ensureRepresentativeForAdmin(admin.id);
        if (!representativeId) {
          console.error("Failed to create representative for admin:", admin.id);
          return res.status(500).json({ error: "Failed to process contact card" });
        }
      } else {
        return res.status(404).json({ error: "Contact card not found" });
      }
    }

    // Insert contact submission with business card data
    const contactData = {
      representative_id: representativeId,
      admin_id: adminId,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      company_name: companyName || null,
      message: `Business card scan - Title: ${title || "N/A"}, Address: ${address || "N/A"}, Website: ${website || "N/A"}`,
      source: "business_card_scan",
      status: "new",
      metadata: {
        title: title || null,
        address: address || null,
        website: website || null,
        business_card_image_url: businessCardImageUrl,
        scanned_at: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from("representative_contacts")
      .insert(contactData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error submitting business card:", error);
    res.status(500).json({ error: error.message || "Failed to submit business card" });
  }
});

export default router;
