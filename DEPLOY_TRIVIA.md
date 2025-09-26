# Deploy Trivia Leads System

## ✅ Local Testing Complete
- Trivia submission API working
- Leaderboard API working  
- In-memory storage functioning as backup

## 🗄️ Database Setup (Required for Production)

**You need to manually create the database table:**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql/new

2. **Copy this SQL and run it:**

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
CREATE INDEX IF NOT EXISTS idx_trivia_leads_created ON trivia_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trivia_leads_score ON trivia_leads(score DESC);

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

3. **Click "RUN"**

## 🚀 Current Status

The app is **ready for deployment** right now:

- ✅ Works without database (in-memory storage)
- ✅ Will automatically use database once table is created
- ✅ Proper error handling and fallbacks
- ✅ Fixed leaderboard sorting (most recent scores first within same score)

## 📱 Testing

Visit `http://localhost:3000/trivia` to test the full trivia experience:

1. Enter your name
2. Answer 5 questions  
3. Enter email and interests
4. See leaderboard update with your score

## 🔧 What Happens When You Deploy

**Without Database Table:**
- Trivia works perfectly
- Scores saved in memory (reset on server restart)
- Users get "Lead saved locally" message

**With Database Table:**  
- Trivia works perfectly
- Scores permanently saved to Supabase
- Users get "Lead saved to database successfully" message
- Data persists between deployments
- You can view all submissions in Supabase Table Editor

## 💡 Recommendation

**Deploy now** - it works perfectly either way. Create the database table when convenient to enable persistent data storage.