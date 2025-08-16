# Database Setup Instructions

## Current Status
- ✅ Supabase connection is configured correctly
- ❌ Database tables do not exist yet
- ✅ SQL script is ready at `scripts/create-supabase-tables.sql`

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (govktyrtmwzbzqkmzmrf)
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `scripts/create-supabase-tables.sql`
6. Paste it into the SQL editor
7. Click **Run** to execute the script
8. You should see a success message

### Option 2: Using MCP Postgres (When Available)
Once the MCP Postgres server is properly connected, you can run:
```sql
-- The contents of scripts/create-supabase-tables.sql
```

### Option 3: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push scripts/create-supabase-tables.sql
```

## After Setup
Run the test script again to verify:
```bash
node scripts/test-database.js
```

## Tables Created
The script will create:
- products (with drive-through specific fields)
- inventory (location-based stock)
- locations (warehouses)
- orders
- order_items
- admin_users
- admin_sessions
- audit_logs
- contact_messages

Plus all necessary indexes and RLS policies for security.