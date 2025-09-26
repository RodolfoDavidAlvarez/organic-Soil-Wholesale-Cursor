# Setting Up Trivia Leads Database in Supabase

Follow these steps to enable trivia lead saving to Supabase:

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

## Step 2: Run the Setup SQL

Copy and paste this entire SQL script into the editor:

```sql
-- Create trivia_leads table for storing quiz submissions
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
CREATE INDEX IF NOT EXISTS idx_trivia_leads_created ON trivia_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trivia_leads_score ON trivia_leads(score DESC);

-- Enable Row Level Security
ALTER TABLE trivia_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create trivia leads" ON trivia_leads;
DROP POLICY IF EXISTS "Anyone can view trivia leads" ON trivia_leads;

-- Allow public inserts (for trivia form submissions)
CREATE POLICY "Anyone can create trivia leads" ON trivia_leads
  FOR INSERT
  WITH CHECK (true);

-- Allow public reads (for leaderboard)
CREATE POLICY "Anyone can view trivia leads" ON trivia_leads
  FOR SELECT
  USING (true);

-- Verify the table was created
SELECT 'Table created successfully!' as message;
```

## Step 3: Execute the Query

1. Click the "Run" button or press Cmd/Ctrl + Enter
2. You should see "Success. No rows returned" or a message saying "Table created successfully!"

## Step 4: Verify It's Working

1. Go to "Table Editor" in the left sidebar
2. You should see a table called "trivia_leads"
3. Play the trivia game and check if new entries appear

## Troubleshooting

If you see errors:
- **"relation already exists"** - The table is already created, you're good to go!
- **Permission errors** - Make sure you're using the service role key in your environment

## What This Enables

✅ All trivia submissions will be saved to the database
✅ Leaderboard data will persist between deployments
✅ You can view all submissions in the Supabase Table Editor
✅ Data is available for analytics and export

## Current Status

The application is already configured to use this table. Once created, it will automatically start saving all trivia leads to Supabase instead of just keeping them in memory.