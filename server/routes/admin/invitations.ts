import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";
import { sendAdminInvitationEmail } from "../../services/email";
import crypto from "crypto";

const router = Router();

// Public routes (no auth required) - must be defined BEFORE adminAuthMiddleware
// Get invitation by token (public endpoint for signup page)
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const { data: invitation, error } = await supabase.from("admin_invitations").select("*").eq("token", token).single();

    if (error || !invitation) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabase.from("admin_invitations").update({ status: "expired" }).eq("id", invitation.id);

      return res.status(400).json({ error: "This invitation has expired" });
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return res.status(400).json({ error: "This invitation has already been used" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "This invitation is no longer valid" });
    }

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        full_name: invitation.full_name,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    res.status(500).json({ error: "Failed to verify invitation" });
  }
});

// Accept invitation and create admin account (public endpoint)
router.post("/accept/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, full_name } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Verify invitation
    const { data: invitation, error: inviteError } = await supabase.from("admin_invitations").select("*").eq("token", token).single();

    if (inviteError || !invitation) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase.from("admin_invitations").update({ status: "expired" }).eq("id", invitation.id);

      return res.status(400).json({ error: "This invitation has expired" });
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return res.status(400).json({ error: "This invitation has already been used" });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("admin_users").select("id").eq("email", invitation.email).single();

    if (existingUser) {
      return res.status(400).json({ error: "An admin with this email already exists" });
    }

    // Hash password
    const bcrypt = require("bcrypt");
    const password_hash = await bcrypt.hash(password, 10);

    // Check if auth user exists (for UUID foreign key)
    const { data: authUser } = await supabase.from("auth.users").select("id").eq("email", invitation.email).single();

    if (!authUser) {
      return res.status(400).json({
        error: "Auth user does not exist. Please contact support to create your account.",
      });
    }

    const authUserId = authUser.id;

    // Create admin user
    const { data: newAdmin, error: adminError } = await supabase
      .from("admin_users")
      .insert({
        id: authUserId,
        email: invitation.email,
        full_name: full_name || invitation.full_name || null,
        role: invitation.role,
        password_hash,
        is_active: true,
        permissions: {},
      })
      .select()
      .single();

    if (adminError) {
      // If it's a foreign key error, the auth user doesn't exist
      if (adminError.code === "23503") {
        return res.status(500).json({
          error: "Account creation failed. Please contact support.",
        });
      }
      throw adminError;
    }

    // Mark invitation as accepted
    await supabase
      .from("admin_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    res.json({
      message: "Account created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// All other routes require authentication
router.use(adminAuthMiddleware);

// Get all invitations (super admin only)
router.get("/", async (req: AdminRequest, res) => {
  try {
    // Check if user is super admin
    if (req.admin?.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can view invitations" });
    }

    const { data: invitations, error } = await supabase.from("admin_invitations").select("*").order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json(invitations || []);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// Send invitation (super admin only)
router.post("/", async (req: AdminRequest, res) => {
  try {
    // Check if user is super admin
    if (req.admin?.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can send invitations" });
    }

    const { email, full_name, role = "admin" } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email address is required" });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("admin_users").select("id").eq("email", email.toLowerCase().trim()).single();

    if (existingUser) {
      return res.status(400).json({ error: "An admin with this email already exists" });
    }

    // Check if there's a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from("admin_invitations")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      return res.status(400).json({ error: "A pending invitation already exists for this email. Please cancel it first to send a new one." });
    }

    // Check if auth user exists, if not we'll need to create it
    // Note: Creating auth users requires Supabase Admin API
    // For now, we'll proceed and handle it during acceptance
    const { data: authUser } = await supabase.from("auth.users").select("id").eq("email", email.toLowerCase().trim()).single();

    if (!authUser) {
      // Log a warning but proceed - we'll handle auth user creation during acceptance
      // or the super admin can create it manually via Supabase dashboard
      console.warn(`Auth user does not exist for ${email}. It will need to be created before invitation can be accepted.`);
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("admin_invitations")
      .insert({
        email: email.toLowerCase().trim(),
        full_name: full_name || null,
        role: role,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: req.admin?.id,
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Send invitation email
    try {
      await sendAdminInvitationEmail({
        email: invitation.email,
        full_name: invitation.full_name,
        token: invitation.token,
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// Cancel/Delete invitation (super admin only)
router.delete("/:id", async (req: AdminRequest, res) => {
  try {
    const { token } = req.params;

    const { data: invitation, error } = await supabase.from("admin_invitations").select("*").eq("token", token).single();

    if (error || !invitation) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabase.from("admin_invitations").update({ status: "expired" }).eq("id", invitation.id);

      return res.status(400).json({ error: "This invitation has expired" });
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return res.status(400).json({ error: "This invitation has already been used" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "This invitation is no longer valid" });
    }

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        full_name: invitation.full_name,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    res.status(500).json({ error: "Failed to verify invitation" });
  }
});

// Accept invitation and create admin account
router.post("/accept/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, full_name } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Verify invitation
    const { data: invitation, error: inviteError } = await supabase.from("admin_invitations").select("*").eq("token", token).single();

    if (inviteError || !invitation) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase.from("admin_invitations").update({ status: "expired" }).eq("id", invitation.id);
      return res.status(400).json({ error: "This invitation has expired" });
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return res.status(400).json({ error: "This invitation has already been used" });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("admin_users").select("id").eq("email", invitation.email).single();

    if (existingUser) {
      return res.status(400).json({ error: "An admin with this email already exists" });
    }

    // Hash password
    const bcrypt = require("bcrypt");
    const password_hash = await bcrypt.hash(password, 10);

    // Check if auth user exists (for UUID foreign key)
    const { data: authUser } = await supabase.from("auth.users").select("id").eq("email", invitation.email).single();

    if (!authUser) {
      return res.status(400).json({
        error: "Auth user does not exist. Please contact support to create your account.",
      });
    }

    const authUserId = authUser.id;

    // Create admin user
    const { data: newAdmin, error: adminError } = await supabase
      .from("admin_users")
      .insert({
        id: authUserId,
        email: invitation.email,
        full_name: full_name || invitation.full_name || null,
        role: invitation.role,
        password_hash,
        is_active: true,
        permissions: {},
      })
      .select()
      .single();

    if (adminError) {
      // If it's a foreign key error, the auth user doesn't exist
      if (adminError.code === "23503") {
        return res.status(500).json({
          error: "Account creation failed. Please contact support.",
        });
      }
      throw adminError;
    }

    // Mark invitation as accepted
    await supabase
      .from("admin_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    res.json({
      message: "Account created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Cancel/Delete invitation (super admin only)
router.delete("/:id", async (req: AdminRequest, res) => {
  try {
    // Check if user is super admin
    if (req.admin?.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can cancel invitations" });
    }

    const { id } = req.params;

    // Get the invitation first to check its status
    const { data: invitation, error: fetchError } = await supabase.from("admin_invitations").select("*").eq("id", id).single();

    if (fetchError || !invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    // Only allow cancelling pending invitations
    if (invitation.status !== "pending") {
      return res.status(400).json({
        error: `Cannot cancel invitation with status "${invitation.status}". Only pending invitations can be cancelled.`,
      });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase.from("admin_invitations").update({ status: "cancelled" }).eq("id", id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: "Invitation cancelled successfully",
      invitation: { ...invitation, status: "cancelled" },
    });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});

export default router;
