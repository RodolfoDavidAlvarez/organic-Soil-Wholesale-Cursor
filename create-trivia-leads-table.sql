-- Create trivia_leads table
CREATE TABLE IF NOT EXISTS public.trivia_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    interests TEXT[] NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
    answers INTEGER[] NOT NULL,
    event_name TEXT DEFAULT 'Trade Show 2025',
    prize_code TEXT DEFAULT 'SOIL20',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_trivia_leads_email ON public.trivia_leads(email);

-- Create index on created_at for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_trivia_leads_created_at ON public.trivia_leads(created_at DESC);

-- Add comment
COMMENT ON TABLE public.trivia_leads IS 'Stores leads captured from the trade show trivia game';