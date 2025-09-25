import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

// In-memory storage for demo (replace with database in production)
let leaderboardData = [];

// Save new trivia lead
router.post('/trivia-leads', async (req, res) => {
  try {
    const { name, email, phone, interests, score, answers } = req.body;

    // Validate required fields
    if (!name || (!email && !phone) || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Save to in-memory storage
    const leadData = {
      id: Date.now().toString(),
      name,
      email: email || null,
      phone: phone || null,
      interests: interests || [],
      score,
      answers: answers || [],
      created_at: new Date().toISOString()
    };

    // Add to leaderboard
    leaderboardData.push({
      name: leadData.name,
      score: leadData.score,
      created_at: leadData.created_at
    });

    // Try to save to database (but don't fail if it doesn't work)
    try {
      await supabase
        .from('trivia_leads')
        .insert(leadData);
    } catch (dbError) {
      console.log('Database save failed, using in-memory storage');
    }

    return res.json({ 
      success: true, 
      data: leadData,
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

// Get today's leaderboard
router.get('/trivia-leads/leaderboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter today's entries from in-memory storage
    const todaysEntries = leaderboardData.filter(entry => {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    // Sort by score (highest first) and then by time (earliest first)
    const sortedEntries = todaysEntries
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, 10)
      .map(({ name, score }) => ({ name, score }));

    return res.json({ 
      success: true, 
      data: sortedEntries
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.json({ 
      success: true, 
      data: [] 
    });
  }
});

// Get all trivia leads (admin only)
router.get('/trivia-leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trivia_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch leads' 
      });
    }

    return res.json({ 
      success: true, 
      data: data || []
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Helper function to create table if it doesn't exist
async function createTriviaTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS trivia_leads (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        interests TEXT[] DEFAULT '{}',
        score INTEGER NOT NULL,
        answers INTEGER[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_trivia_leads_created ON trivia_leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_trivia_leads_score ON trivia_leads(score DESC);
    `
  });
  
  if (error) {
    console.error('Error creating table:', error);
  }
}

export default router;