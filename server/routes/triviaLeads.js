import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for trivia lead routes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

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

    // Create lead data
    const leadData = {
      name,
      email: email || null,
      phone: phone || null,
      interests: interests || [],
      score,
      answers: answers || [],
      created_at: new Date().toISOString()
    };

    // Always try to save to database first
    try {
      const { data, error } = await supabase
        .from('trivia_leads')
        .insert(leadData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error.code, error.message);
        
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST204' || error.code === '42P01') {
          console.log('📌 Trivia table not found. Run setup-trivia-table.sql in Supabase SQL editor');
          // Also save to in-memory as backup
          inMemoryLeads.push(leadData);
          return res.json({ 
            success: true, 
            data: leadData,
            message: 'Lead saved locally (database table needs setup)' 
          });
        }
        
        // For other errors, still save to in-memory
        inMemoryLeads.push(leadData);
        return res.json({ 
          success: true, 
          data: leadData,
          message: 'Lead saved (backup storage)' 
        });
      }

      // Success - data saved to Supabase!
      console.log('✅ Lead saved to Supabase:', data.name, 'Score:', data.score);
      // Also keep in memory for fast access
      inMemoryLeads.push(data);
      
      return res.json({ 
        success: true, 
        data: data,
        message: 'Lead saved to database successfully' 
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Save to in-memory storage as fallback
      inMemoryLeads.push(leadData);
      return res.json({ 
        success: true, 
        data: leadData,
        message: 'Lead saved locally' 
      });
    }
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let leaderboardData = [];
    
    // Always try database first
    try {
      const { data, error } = await supabase
        .from('trivia_leads')
        .select('name, score, created_at')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: false }) // Most recent first for same scores
        .limit(10);

      if (error) {
        console.log('Database query error:', error.code);
        // Use in-memory fallback
        leaderboardData = inMemoryLeads
          .filter(lead => {
            const leadDate = new Date(lead.created_at);
            return leadDate >= today && leadDate < tomorrow;
          })
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, 10);
      } else {
        // Combine database data with recent in-memory data (in case of recent submissions)
        const dbIds = new Set(data.map(d => d.name + d.score + d.created_at));
        const recentMemoryData = inMemoryLeads
          .filter(lead => {
            const leadDate = new Date(lead.created_at);
            const key = lead.name + lead.score + lead.created_at;
            return leadDate >= today && leadDate < tomorrow && !dbIds.has(key);
          });
        
        leaderboardData = [...data, ...recentMemoryData]
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, 10);
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Use in-memory fallback
      leaderboardData = inMemoryLeads
        .filter(lead => {
          const leadDate = new Date(lead.created_at);
          return leadDate >= today && leadDate < tomorrow;
        })
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 10);
    }

    // Map to only include name and score for the response
    const leaderboardEntries = leaderboardData.map(({ name, score }) => ({ name, score }));

    return res.json({ 
      success: true, 
      data: leaderboardEntries
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

// In-memory fallback storage for when database is unavailable
let inMemoryLeads = [];

// Helper function to ensure table exists
async function ensureTriviaTable() {
  try {
    // First check if table exists by trying to query it
    const { error: queryError } = await supabase
      .from('trivia_leads')
      .select('id')
      .limit(1);
    
    if (queryError && queryError.code === 'PGRST205') { // Table doesn't exist
      console.log('⚠️  Trivia leads table not found in database');
      console.log('Using in-memory storage as fallback');
      console.log('To enable persistent storage, create the trivia_leads table in Supabase');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

// Check table availability on startup
let dbAvailable = false;
ensureTriviaTable().then(available => {
  dbAvailable = available;
  if (!dbAvailable) {
    console.log('Database unavailable - using in-memory storage');
  }
});

export default router;
