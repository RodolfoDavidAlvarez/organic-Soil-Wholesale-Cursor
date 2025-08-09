import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
    permissions: any;
  };
}

export const adminAuth = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // For now, accept any authenticated user as admin
    // In production, you'd check against an admin_profiles table
    req.admin = {
      id: user.id as any,
      email: user.email!,
      role: 'admin',
      permissions: { all: true }
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.admin.role) && req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const logAdminAction = async (
  adminId: string,
  action: string,
  entityType?: string,
  entityId?: number,
  oldValues?: any,
  newValues?: any,
  req?: Request
) => {
  try {
    // Log to Supabase admin_audit_logs table if it exists
    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        entity_type: entityType,
        entity_id: entityId?.toString(),
        old_values: oldValues,
        new_values: newValues,
        ip_address: req?.ip,
        user_agent: req?.headers['user-agent']
      });
    
    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};