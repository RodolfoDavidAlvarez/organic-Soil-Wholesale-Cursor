import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Reset admin password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { setupKey } = req.body;
    
    if (setupKey !== 'initial-setup-2024') {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Find the admin user
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users.users.find(u => u.email === 'ralvarez@soilseedandwater.com');

    if (adminUser) {
      // Update the user's password
      const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
        password: 'Admin2024!Soil'
      });

      if (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Failed to update password', details: error.message });
      }

      return res.json({
        success: true,
        message: 'Admin password updated successfully'
      });
    } else {
      return res.status(404).json({ error: 'Admin user not found' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
});

// Initialize admin user in Supabase Auth
router.post('/setup-initial', async (req, res) => {
  try {
    const { setupKey } = req.body;
    
    if (setupKey !== 'initial-setup-2024') {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Check if admin user exists by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === 'ralvarez@soilseedandwater.com');

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

    // User exists, but make sure admin profile exists
    const { data: existingProfile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', existingUser.id)
      .single();

    if (!existingProfile) {
      // Create admin profile for existing user
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .insert({
          id: existingUser.id,
          email: 'ralvarez@soilseedandwater.com',
          role: 'super_admin',
          permissions: { all: true }
        });

      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        return res.status(500).json({ error: 'Failed to create admin profile', details: profileError.message });
      }

      return res.json({
        success: true,
        message: 'Admin profile created for existing user'
      });
    }

    return res.json({
      success: true,
      message: 'Admin user and profile already exists'
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

    // Create a client-side Supabase instance for authentication
    const clientSupabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NjYsImV4cCI6MjA3MDM0NTU2Nn0.n59e225VDBmFyLeVzmwlrlv_yt27bvbZLAsl1SgSjwo');

    // Sign in with Supabase
    const { data, error } = await clientSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has admin role using service role client
    console.log('=== ADMIN LOGIN DEBUG ===');
    console.log('User authenticated successfully:', {
      id: data.user.id,
      email: data.user.email
    });
    
    console.log('Querying admin_profiles with service role...');
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    console.log('Profile query result:', { 
      profile: profile, 
      profileError: profileError,
      hasProfile: !!profile 
    });
    
    // Also test a general query to make sure service role works
    const { data: allProfiles, error: allError } = await supabase
      .from('admin_profiles')
      .select('*');
    console.log('All profiles query:', { 
      count: allProfiles?.length || 0, 
      error: allError 
    });

    if (!profile) {
      await clientSupabase.auth.signOut();
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