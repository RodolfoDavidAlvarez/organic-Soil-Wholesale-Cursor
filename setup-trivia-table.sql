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

-- Insert some test data to verify it's working
INSERT INTO trivia_leads (name, email, score, interests)
VALUES 
  ('Test User 1', 'test1@example.com', 5, ARRAY['Vegetables', 'Landscaping']),
  ('Test User 2', 'test2@example.com', 4, ARRAY['Cannabis']),
  ('Test User 3', 'test3@example.com', 5, ARRAY['Indoor Plants'])
ON CONFLICT DO NOTHING;

-- Verify the table was created and data inserted
SELECT COUNT(*) as total_leads FROM trivia_leads;