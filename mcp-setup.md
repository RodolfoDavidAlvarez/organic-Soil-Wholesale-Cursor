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
        "--service-role-key", "YOUR_LOCAL_SUPABASE_SERVICE_ROLE_KEY"
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
