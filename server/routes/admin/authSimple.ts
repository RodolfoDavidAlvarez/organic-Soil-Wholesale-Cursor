import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple login using Supabase Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      token: data.session.access_token,
      admin: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        permissions: { all: true }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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
      console.error('Session validation error:', error);
      return res.status(401).json({ error: 'Invalid session' });
    }

    res.json({
      admin: {
        id: user.id,
        email: user.email,
        role: 'admin',
        permissions: { all: true }
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Session check failed' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Sign out from Supabase
      await supabase.auth.admin.signOut(token);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'ralvarez@soilseedandwater.com',
      password: 'Admin2024!Soil',
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({ error: authError.message });
    }

    res.json({ 
      success: true, 
      message: 'Admin user created in Supabase Auth',
      userId: authData.user.id 
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;