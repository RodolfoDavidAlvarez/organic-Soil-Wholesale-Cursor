# Trivia Game Setup

## Database Setup (Required for Production)

The trivia game requires a `trivia_leads` table in your Supabase database. Until this table is created, the application will use in-memory storage (which resets on each deployment).

### Create the Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create trivia_leads table
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

-- Create indexes for performance
CREATE INDEX idx_trivia_leads_created ON trivia_leads(created_at DESC);
CREATE INDEX idx_trivia_leads_score ON trivia_leads(score DESC);

-- Enable Row Level Security
ALTER TABLE trivia_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for trivia form submissions)
CREATE POLICY "Anyone can create trivia leads" ON trivia_leads
  FOR INSERT
  WITH CHECK (true);

-- Allow public reads (for leaderboard)
CREATE POLICY "Anyone can view trivia leads" ON trivia_leads
  FOR SELECT
  USING (true);
```

### Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/editor)
2. Click "SQL Editor" in the sidebar
3. Paste and run the SQL above

## Features Fixed

1. **Leaderboard Sorting**: Now correctly sorts by score (highest first), then by time (most recent first within same score)
2. **Production Deployment**: Works on Vercel with graceful fallback to in-memory storage when database is unavailable

## Testing

The system includes fallback in-memory storage that works both locally and on Vercel until the database table is created.