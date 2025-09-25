import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Access the shared memory store
const memoryStore = global.triviaLeads || [];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let leaderboardData = [];
      
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

        if (error && error.code === 'PGRST205') {
          // Table doesn't exist, use in-memory data
          console.log('Database table not found, using in-memory leaderboard');
          leaderboardData = memoryStore
            .filter(lead => {
              const leadDate = new Date(lead.created_at);
              return leadDate >= today && leadDate < tomorrow;
            })
            .sort((a, b) => {
              // Sort by score descending, then by time descending (most recent first)
              if (b.score !== a.score) return b.score - a.score;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, 10);
        } else if (error) {
          console.error('Database query error:', error);
          // Other error, return empty
          return res.json({ 
            success: true, 
            data: [] 
          });
        } else {
          leaderboardData = data || [];
        }

        // Map to only include name and score for the response
        const leaderboardEntries = leaderboardData.map(({ name, score }) => ({ name, score }));

        return res.json({ 
          success: true, 
          data: leaderboardEntries
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Return empty leaderboard if database fails
        return res.json({ 
          success: true, 
          data: [] 
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.json({ 
        success: true, 
        data: [] 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}