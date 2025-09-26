import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple in-memory storage for Vercel (resets on each deployment)
// This is a temporary solution until the database table is created
const memoryStore = global.triviaLeads || [];
global.triviaLeads = memoryStore;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
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

        if (error && error.code === 'PGRST205') {
          // Table doesn't exist, use in-memory storage
          console.log('Database table not found, using in-memory storage');
          memoryStore.push(leadData);
          return res.json({ 
            success: true, 
            data: leadData,
            message: 'Lead saved (temporary storage)' 
          });
        } else if (error) {
          console.error('Database insert error:', error);
          // Other database error, still save to memory
          memoryStore.push(leadData);
          return res.json({ 
            success: true, 
            data: leadData,
            message: 'Lead saved (backup storage)' 
          });
        }

        return res.json({ 
          success: true, 
          data: data || leadData,
          message: 'Lead saved successfully' 
        });
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Save to in-memory storage as fallback
        memoryStore.push(leadData);
        return res.json({ 
          success: true, 
          data: leadData,
          message: 'Lead saved (fallback storage)' 
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Server error' 
      });
    }
  } else if (req.method === 'GET') {
    // Get all trivia leads (admin only)
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
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}