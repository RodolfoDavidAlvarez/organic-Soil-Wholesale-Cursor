# Complete Setup Guide for Drive-Through Pickup System

## Prerequisites Checklist

- [x] Supabase project created
- [x] Stripe account with API keys
- [ ] Database tables created
- [ ] Products seeded
- [ ] Environment variables configured

## Step 1: Database Setup

### 1.1 Run Base Tables First

Go to Supabase SQL Editor: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql/new

Run the SQL from `setupDatabase-step1.md` first to create:

- products table
- orders table
- Row Level Security policies

### 1.2 Run Inventory Tables

After base tables are created, run the SQL from `setupDatabase.md` to create:

- locations table
- inventory table
- inventory_transactions table
- order_items table
- Additional columns on orders table

### 1.3 Verify Tables

Go to Table Editor and verify all tables exist:

- products
- orders
- locations
- inventory
- inventory_transactions
- order_items

## Step 2: Environment Configuration

### 2.1 Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Update `.env` file:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
   ```

### 2.2 Set Up Stripe Webhook

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/checkout/webhook`
3. Select events: `checkout.session.completed`
4. Copy the signing secret and add to `server/.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

## Step 3: Seed Initial Data

### 3.1 Update Product Prices

Edit `scripts/seedInitialProducts.ts` with your actual prices:

- Dan's Gold Dairy Compost (1 cu ft): $15.00
- Plant Pal Potting Soil (2 cu ft): $25.00
- Oasis Blend (1 cu ft): $20.00

### 3.2 Run Seed Script

```bash
cd scripts
npm install @supabase/supabase-js dotenv
node seedInitialProducts.js
```

## Step 4: Test the System

### 4.1 Access Points

- **Pay & Pickup Landing**: http://localhost:3000/pay-and-pickup (existing design, alias `/drive-through`)
- **Quick Order**: http://localhost:3000/quick-order (new simple version)
- **Checkout**: http://localhost:3000/checkout

### 4.2 Mobile Access

1. Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Access from phone: `http://YOUR_IP:3000/quick-order`

### 4.3 Test Flow

1. Go to `/quick-order`
2. Add products to cart
3. Click Checkout
4. Fill in details
5. Pay with Stripe test card: `4242 4242 4242 4242`
6. Verify order confirmation

## Step 5: Production Deployment

### 5.1 Update Environment Variables

In your production environment (Vercel/Netlify), set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 5.2 Update Webhook URL

Change Stripe webhook to: `https://your-production-domain.com/api/checkout/webhook`

## Troubleshooting

### Products Not Showing

1. Check browser console for errors
2. Verify database has products:
   ```sql
   SELECT * FROM products;
   SELECT * FROM inventory;
   ```
3. Check API response: http://localhost:3000/api/inventory/location/1

### Payment Not Working

1. Verify Stripe keys are set correctly
2. Check server logs for Stripe errors
3. Ensure webhook secret is configured

### Inventory Not Updating

1. Check inventory_transactions table
2. Verify webhook is receiving events
3. Check server logs for database errors

## Next Steps

1. Add SMS notifications (Twilio)
2. Build admin dashboard
3. Add more products
4. Implement bulk ordering
5. Add delivery scheduling
