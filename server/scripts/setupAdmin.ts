import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

import { db } from '../db';
import { adminUsers } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function setupAdminTables() {
  try {
    console.log('Setting up admin tables...');

    // Create admin_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager', 'order_processor')),
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create audit_logs table
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

    // Create admin_sessions table
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

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`);

    console.log('Admin tables created successfully!');

    // Check if admin user exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, 'ralvarez@soilseedandwater.com'))
      .limit(1);

    if (existingAdmin.length === 0) {
      // Insert initial admin user
      await db.insert(adminUsers).values({
        email: 'ralvarez@soilseedandwater.com',
        role: 'super_admin',
        permissions: { all: true },
        isActive: true
      });

      console.log('\nAdmin user created successfully!');
      console.log('=====================================');
      console.log('Email: ralvarez@soilseedandwater.com');
      console.log('Temporary password: Admin2024!Soil');
      console.log('=====================================');
    } else {
      console.log('Admin user already exists');
    }

    console.log('\nSetup completed! You can now access the admin panel at:');
    console.log('http://localhost:3000/admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin tables:', error);
    process.exit(1);
  }
}

setupAdminTables();