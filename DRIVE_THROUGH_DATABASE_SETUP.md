# Drive-Through Database Setup Guide

## Overview
This guide will help you set up the complete database schema for the drive-through system using Supabase.

## Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf
2. Navigate to the SQL Editor (in the left sidebar)

## Step 2: Execute Main Database Schema

1. In the SQL Editor, create a new query
2. Copy ALL contents from: `scripts/create-supabase-tables.sql`
3. Paste into the SQL editor
4. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)
5. You should see "Success. No rows returned" for most statements

## Step 3: Execute Drive-Through Enhancements

1. Create another new query in the SQL Editor
2. Copy ALL contents from: `scripts/drive-through-enhancements.sql`
3. Paste into the SQL editor
4. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)
5. You should see "Success. No rows returned" for most statements

## Step 4: Verify Table Creation

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- admin_sessions
- admin_users
- audit_logs
- contact_messages
- customer_drive_through_preferences
- drive_through_queue
- inventory
- inventory_alerts
- locations
- notification_log
- notification_preferences
- order_items
- order_status_history
- orders
- pricing_tiers
- products

## Step 5: Seed Product Data

After tables are created, run from terminal:

```bash
cd "/Users/rodolfoalvarez/Documents/Soil Seed and Water/Organic Soil Wholesale/Organic Soil Wholesale Website"
npx tsx scripts/seedCompleteProductDatabase.ts
```

## Step 6: Update Pricing Data

After products are seeded, run:

```bash
npx tsx scripts/updatePricingFromHTML.ts
```

## Step 7: Verify Setup

Finally, test the complete setup:

```bash
npx tsx scripts/testDatabaseConnection.ts
```

## Alternative: Using Postgres MCP

If you want to use MCP for direct database access, you can set up the Postgres MCP server:

1. Install MCP Postgres server:
```bash
npm install -g @modelcontextprotocol/server-postgres
```

2. Add to your Claude MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "postgres-supabase": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "postgresql://postgres.govktyrtmwzbzqkmzmrf:vatbur-musfar-Puzbu8@aws-0-us-west-1.pooler.supabase.com:5432/postgres"]
    }
  }
}
```

3. Restart Claude Desktop
4. You'll then have direct SQL access via `@postgres-supabase`

## Expected Results

After successful setup, you should have:
- ✅ 16 database tables created
- ✅ 1 location (Phoenix Warehouse)
- ✅ 29 products from CSV/JSON data
- ✅ Dynamic pricing tiers
- ✅ Drive-through specific features
- ✅ Inventory management ready

## Troubleshooting

If you encounter errors:
1. Check if tables already exist (some errors are normal)
2. Ensure you're using the service role key (not anon key)
3. Check Supabase logs for detailed error messages
4. Try running statements one at a time if bulk execution fails