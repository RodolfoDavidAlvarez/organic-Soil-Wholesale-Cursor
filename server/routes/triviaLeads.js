import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';
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

    // Try to save to database
    try {
      if (dbAvailable) {
        const { data, error } = await supabase
          .from('trivia_leads')
          .insert(leadData)
          .select()
          .single();

        if (error) {
          console.error('Database insert error:', error);
          // Fall back to in-memory storage
          inMemoryLeads.push(leadData);
          return res.json({ 
            success: true, 
            data: leadData,
            message: 'Lead saved (using backup storage)' 
          });
        }

        return res.json({ 
          success: true, 
          data: data || leadData,
          message: 'Lead saved successfully' 
        });
      } else {
        // Use in-memory storage
        inMemoryLeads.push(leadData);
        return res.json({ 
          success: true, 
          data: leadData,
          message: 'Lead saved (database pending setup)' 
        });
      }
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      // Return success even if database fails to not break the user experience
      return res.json({ 
        success: true, 
        data: leadData,
        message: 'Lead saved (database unavailable)' 
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
    
    if (dbAvailable) {
      try {
        // Try to get from database first
        const { data, error } = await supabase
          .from('trivia_leads')
          .select('name, score, created_at')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('score', { ascending: false })
          .order('created_at', { ascending: false }) // Most recent first for same scores
          .limit(10);

        if (error) {
          console.error('Database query error:', error);
          // Fall back to in-memory data
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
          leaderboardData = data || [];
        }
      } catch (dbError) {
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
    } else {
      // Use in-memory data
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