import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { adminUsers, adminSessions, auditLogs } from '../../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

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

// Temporary setup endpoint - REMOVE IN PRODUCTION
router.post('/setup-initial', async (req, res) => {
  try {
    const { setupKey } = req.body;
    
    if (setupKey !== 'initial-setup-2024') {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Create admin tables (will fail silently if they exist)
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER REFERENCES admin_users(id),
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50),
          entity_id INTEGER,
          old_values JSONB,
          new_values JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.log('Tables might already exist, continuing...');
    }

    // Check if admin exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, 'ralvarez@soilseedandwater.com'))
      .limit(1);

    if (existingAdmin.length === 0) {
      // Create admin user
      await db.insert(adminUsers).values({
        email: 'ralvarez@soilseedandwater.com',
        role: 'super_admin',
        permissions: { all: true },
        isActive: true
      });

      return res.json({
        success: true,
        message: 'Admin user created successfully'
      });
    } else {
      return res.json({
        success: true,
        message: 'Admin user already exists'
      });
    }
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

export default router;