# Setting Up Admin Access

## Quick Setup Instructions

1. **Make sure the server is running:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to: http://localhost:3000

3. **Open the browser console** (Right-click → Inspect → Console)

4. **Copy and paste this code** into the console:
   ```javascript
   fetch('/api/admin/auth/setup-initial', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ setupKey: 'initial-setup-2024' })
   })
   .then(r => r.json())
   .then(console.log)
   ```

5. **You should see:** "Admin user created successfully"

## Admin Login Credentials

- **URL:** http://localhost:3000/admin
- **Email:** ralvarez@soilseedandwater.com
- **Password:** Admin2024!Soil

## What You Can Do

- **Products:** Full CRUD operations, manage all product fields
- **Inventory:** Track stock levels (coming soon)
- **Orders:** View and manage orders including drive-through
- **Dashboard:** See key metrics and quick actions

## Troubleshooting

If you get an error:
1. Make sure the server is running
2. Check that DATABASE_URL is set in .env file
3. Try refreshing and running the setup again

## Security Note

The setup endpoint is temporary. Remove it before deploying to production!