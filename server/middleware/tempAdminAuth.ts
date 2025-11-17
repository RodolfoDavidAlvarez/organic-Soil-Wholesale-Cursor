import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
    permissions?: any;
  };
}

export function tempAdminAuthMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  // TEMPORARY: Bypass authentication for development
  // TODO: Re-enable authentication before deployment
  req.admin = {
    id: '1',
    email: 'admin@soilseedandwater.com',
    role: 'super_admin',
    permissions: { all: true }
  };
  next();
  
  /* ORIGINAL AUTH CODE - DISABLED FOR DEVELOPMENT
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // For temporary auth, just verify the token structure
    if (decoded.id && decoded.email && decoded.role) {
      req.admin = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: { all: true }, // Grant all permissions for temp admin
      };
      next();
    } else {
      return res.status(401).json({ error: "Invalid token structure" });
    }
  } catch (error) {
    console.error("Temp admin auth error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
  */
}
