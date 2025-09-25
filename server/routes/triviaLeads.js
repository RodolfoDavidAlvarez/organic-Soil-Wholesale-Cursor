import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

router.post('/trivia-leads', async (req, res) => {
  try {
    const { name, email, interests, score, answers } = req.body;

    // Validate required fields
    if (!name || !email || !interests || score === undefined || !answers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Insert lead into database
    const { data, error } = await supabase
      .from('trivia_leads')
      .insert({
        name,
        email,
        interests,
        score,
        answers,
        event_name: 'Trade Show 2025',
        prize_code: 'SOIL20'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save information' 
      });
    }

    return res.json({ 
      success: true, 
      data,
      message: 'Lead saved successfully' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Get all trivia leads (admin only)
router.get('/trivia-leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trivia_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch leads' 
      });
    }

    return res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

export default router;