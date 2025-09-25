-- Create trivia_leads table for trade show CRM
CREATE TABLE IF NOT EXISTS trivia_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  interests TEXT[] NOT NULL,
  score INTEGER NOT NULL,
  answers INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_name TEXT DEFAULT 'Trade Show 2025',
  prize_code TEXT DEFAULT 'SOIL20',
  contacted BOOLEAN DEFAULT false
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_trivia_leads_email ON trivia_leads(email);

-- Create index for created_at to sort by newest
CREATE INDEX IF NOT EXISTS idx_trivia_leads_created ON trivia_leads(created_at DESC);

-- Enable Row Level Security
ALTER TABLE trivia_leads ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin) to view all
CREATE POLICY "Admin can view all trivia leads" ON trivia_leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy for inserting new leads (public access for trivia form)
CREATE POLICY "Anyone can create trivia leads" ON trivia_leads
  FOR INSERT
  WITH CHECK (true);