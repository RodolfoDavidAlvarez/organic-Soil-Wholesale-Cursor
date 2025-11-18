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
