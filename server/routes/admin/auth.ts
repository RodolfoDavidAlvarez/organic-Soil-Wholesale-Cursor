import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../../db';
import { adminUsers, adminSessions, auditLogs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // For initial setup, check if this is the first login
    const admins = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    
    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];

    // For initial setup with temporary password
    if (email === 'ralvarez@soilseedandwater.com' && password === 'Admin2024!Soil') {
      // Create a session
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(adminSessions).values({
        adminId: admin.id,
        token,
        expiresAt,
      });

      // Update last login
      await db
        .update(adminUsers)
        .set({ lastLogin: new Date() })
        .where(eq(adminUsers.id, admin.id));

      // Log the action
      await db.insert(auditLogs).values({
        adminId: admin.id,
        action: 'admin_login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
        requirePasswordChange: true, // Flag to force password change
      });
    }

    // For future: implement proper password hashing
    // const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    // if (!isValidPassword) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Check session endpoint
router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const sessions = await db
      .select({
        session: adminSessions,
        admin: adminUsers,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
      .where(eq(adminSessions.token, token));

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { session, admin } = sessions[0];

    if (session.expiresAt < new Date()) {
      await db.delete(adminSessions).where(eq(adminSessions.id, session.id));
      return res.status(401).json({ error: 'Session expired' });
    }

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Session check failed' });
  }
});

export default router;