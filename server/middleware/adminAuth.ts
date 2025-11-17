import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminRequest extends Request {
  admin?: {
    id: string; // Changed to string for UUID
    email: string;
    role: string;
    permissions?: any;
  };
}

export async function adminAuthMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
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
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify admin exists in database
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
  */
}

export function createAdminToken(admin: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}