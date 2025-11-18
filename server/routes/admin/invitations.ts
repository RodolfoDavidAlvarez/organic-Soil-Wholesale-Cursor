import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";
import { sendAdminInvitationEmail } from "../../services/email";
import crypto from "crypto";
import bcrypt from "bcrypt";

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

    console.log("Accept invitation request:", { token: token.substring(0, 10) + "...", hasPassword: !!password, passwordLength: password?.length });

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Verify invitation
    const { data: invitation, error: inviteError } = await supabase.from("admin_invitations").select("*").eq("token", token).single();

    if (inviteError || !invitation) {
      console.error("Invitation not found:", inviteError);
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    console.log("Invitation found:", { email: invitation.email, status: invitation.status });

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
    const { data: existingUser, error: existingUserError } = await supabase.from("admin_users").select("id").eq("email", invitation.email).single();

    if (existingUser) {
      console.log("Admin user already exists:", existingUser);
      return res.status(400).json({ error: "An admin with this email already exists" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Check if auth user exists, or create it using Admin API
    let authUserId: string;
    
    try {
      // Try to get existing user by email
      const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error("Error listing auth users:", listError);
        // If listing fails, try to create the user directly
      }
      
      const existingUser = existingAuthUsers?.users?.find(u => u.email === invitation.email.toLowerCase().trim());
      
      if (existingUser) {
        console.log("Auth user found:", { id: existingUser.id, email: invitation.email });
        authUserId = existingUser.id;
      } else {
        // Create auth user using Admin API
        console.log("Creating auth user for:", invitation.email);
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: invitation.email.toLowerCase().trim(),
          password: password, // User will use this password
          email_confirm: true, // Auto-confirm email since they're accepting an invitation
        });

        if (createError || !newAuthUser?.user) {
          console.error("Error creating auth user:", createError);
          return res.status(500).json({
            error: `Failed to create authentication account: ${createError?.message || "Unknown error"}. Please contact support.`,
          });
        }

        console.log("Auth user created:", { id: newAuthUser.user.id, email: invitation.email });
        authUserId = newAuthUser.user.id;
      }
    } catch (error: any) {
      console.error("Error checking/creating auth user:", error);
      return res.status(500).json({
        error: `Failed to set up authentication: ${error?.message || "Unknown error"}. Please contact support.`,
      });
    }

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
      console.error("Error creating admin user:", adminError);
      // If it's a foreign key error, the auth user doesn't exist
      if (adminError.code === "23503") {
        return res.status(500).json({
          error: "Account creation failed: Foreign key constraint violation. Please contact support.",
        });
      }
      // If it's a unique constraint error, user already exists
      if (adminError.code === "23505") {
        return res.status(400).json({
          error: "An admin with this email already exists.",
        });
      }
      return res.status(500).json({
        error: `Account creation failed: ${adminError.message || "Unknown error"}`,
      });
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
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ 
      error: error?.message || "Failed to create account. Please try again or contact support." 
    });
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

    const { data: invitations, error } = await supabase
      .from("admin_invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Check which invitations have corresponding admin accounts
    const invitationsWithAccountStatus = await Promise.all(
      (invitations || []).map(async (invitation) => {
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("id, role, is_active")
          .eq("email", invitation.email)
          .single();

        return {
          ...invitation,
          account_created: !!adminUser,
          current_role: adminUser?.role || null,
          is_active: adminUser?.is_active || false,
        };
      })
    );

    res.json(invitationsWithAccountStatus);
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

    // Note: Auth user will be created automatically when invitation is accepted
    // No need to check here - the accept endpoint will handle it

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

// Resend invitation email (super admin only)
router.post("/:id/resend", async (req: AdminRequest, res) => {
  try {
    // Check if user is super admin
    if (req.admin?.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can resend invitations" });
    }

    const { id } = req.params;

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from("admin_invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    // Check if invitation is already accepted
    if (invitation.status === "accepted") {
      return res.status(400).json({ error: "Cannot resend an accepted invitation" });
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
      return res.status(500).json({ error: "Failed to send invitation email" });
    }

    res.json({
      message: "Invitation email resent successfully",
      invitation,
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(500).json({ error: "Failed to resend invitation" });
  }
});

// Update admin role (super admin only)
router.patch("/admin/:email/role", async (req: AdminRequest, res) => {
  try {
    // Check if user is super admin
    if (req.admin?.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can update roles" });
    }

    const { email } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "super_admin", "inventory_manager", "order_processor"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Update admin user role
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin_users")
      .update({ role })
      .eq("email", email.toLowerCase().trim())
      .select()
      .single();

    if (updateError || !updatedAdmin) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    res.json({
      message: "Admin role updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin role:", error);
    res.status(500).json({ error: "Failed to update admin role" });
  }
});

// Permanently delete invitation (super admin only)
router.delete("/:id/permanent", async (req: AdminRequest, res) => {
  try {
    // Check if user is super admin
    if (req.admin?.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can delete invitations" });
    }

    const { id } = req.params;

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("admin_invitations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      message: "Invitation deleted permanently",
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ error: "Failed to delete invitation" });
  }
});

export default router;
