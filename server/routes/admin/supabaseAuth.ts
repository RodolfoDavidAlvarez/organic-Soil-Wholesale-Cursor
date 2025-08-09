import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Initialize admin user in Supabase Auth
router.post('/setup-initial', async (req, res) => {
  try {
    const { setupKey } = req.body;
    
    if (setupKey !== 'initial-setup-2024') {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Check if admin user exists
    const { data: existingUser } = await supabase.auth.admin.getUserById(
      'ralvarez@soilseedandwater.com'
    ).catch(() => ({ data: null }));

    if (!existingUser) {
      // Create admin user in Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'ralvarez@soilseedandwater.com',
        password: 'Admin2024!Soil',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          name: 'Admin User'
        }
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        return res.status(500).json({ error: 'Failed to create admin user', details: createError.message });
      }

      // Create admin profile in database
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .insert({
          id: newUser.user.id,
          email: 'ralvarez@soilseedandwater.com',
          role: 'super_admin',
          permissions: { all: true }
        });

      if (profileError) {
        console.error('Error creating admin profile:', profileError);
      }

      return res.json({
        success: true,
        message: 'Admin user created successfully in Supabase'
      });
    }

    return res.json({
      success: true,
      message: 'Admin user already exists'
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

// Login endpoint using Supabase Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    res.json({
      token: data.session.access_token,
      admin: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role,
        permissions: profile.permissions
      },
      session: data.session
    });
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
      // Revoke the session
      await supabase.auth.admin.signOut(token);
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

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get admin profile
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    res.json({
      admin: {
        id: user.id,
        email: user.email,
        role: profile.role,
        permissions: profile.permissions
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Session check failed' });
  }
});

export default router;