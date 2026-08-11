import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../supabaseClient";
import { requireJwtSecret } from "../security/jwtSecret";

export interface AdminRequest extends Request {
  admin?: {
    id: string; // Changed to string for UUID
    email: string;
    role: string;
    permissions?: any;
  };
}

export async function verifyAdminTokenValue(token: string): Promise<AdminRequest["admin"] | null> {
  try {
    const decoded = jwt.verify(token, requireJwtSecret()) as { id?: string };
    if (!decoded.id) return null;

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("id, email, role, permissions, is_active")
      .eq("id", decoded.id)
      .single();

    if (error || !admin || admin.is_active === false) return null;

    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || {},
    };
  } catch {
    return null;
  }
}

export async function adminAuthMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const admin = await verifyAdminTokenValue(token);
    if (!admin) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function createAdminToken(admin: { id: string; email: string; role: string }) {
  return jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, requireJwtSecret(), { expiresIn: "8h" });
}

// Middleware to require super admin role
export function requireSuperAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  if (!req.admin || req.admin.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

// Middleware to require admin or super admin role
export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
