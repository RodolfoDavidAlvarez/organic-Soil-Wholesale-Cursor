import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { adminSessions, adminUsers, auditLogs } from '../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

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

    // Check admin session
    const session = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session.length) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get admin user
    const admin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, session[0].adminId))
      .limit(1);

    if (!admin.length || !admin[0].isActive) {
      return res.status(401).json({ error: 'Admin account not found or inactive' });
    }

    // Update last activity
    await db
      .update(adminSessions)
      .set({ lastActivity: new Date() })
      .where(eq(adminSessions.id, session[0].id));

    // Attach admin to request
    req.admin = {
      id: admin[0].id,
      email: admin[0].email,
      role: admin[0].role,
      permissions: admin[0].permissions
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
  adminId: number,
  action: string,
  entityType?: string,
  entityId?: number,
  oldValues?: any,
  newValues?: any,
  req?: Request
) => {
  try {
    await db.insert(auditLogs).values({
      adminId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent']
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};