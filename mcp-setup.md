# Supabase MCP Setup Instructions

## 1. Install MCP Server

```bash
# Install the Supabase MCP server globally
npm install -g @modelcontextprotocol/server-supabase

# Or use npx (recommended)
npx @modelcontextprotocol/server-supabase
```

## 2. Configure Claude Desktop

Add this to your Claude desktop configuration file:

**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-supabase",
        "--url", "https://govktyrtmwzbzqkmzmrf.supabase.co",
        "--service-role-key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI"
      ]
    }
  }
}
```

## 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop for the changes to take effect.

## 4. Using Supabase MCP

Once configured, you can use commands like:
- `@supabase` to query your database directly
- Run SQL queries
- Manage tables and data
- Check real-time subscriptions

## Example Usage

```
@supabase SELECT * FROM products;
@supabase SELECT * FROM inventory WHERE location_id = 1;
```

This will allow direct database access without creating API endpoints!