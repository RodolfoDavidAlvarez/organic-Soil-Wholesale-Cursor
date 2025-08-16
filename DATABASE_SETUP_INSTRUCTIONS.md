# 🗄️ Database Setup Instructions for Drive-Through System

## CRITICAL: Run These Steps in Order

### Step 1: Set Up Supabase Database Schema

1. **Go to your Supabase Dashboard**: https://govktyrtmwzbzqkmzmrf.supabase.co

2. **Open SQL Editor**: Click "SQL Editor" in the left sidebar

3. **Run the main schema**: Copy and paste the entire contents of `scripts/create-supabase-tables.sql` into the SQL editor and execute it.

4. **Run drive-through enhancements**: Copy and paste the entire contents of `scripts/drive-through-enhancements.sql` into the SQL editor and execute it.

### Step 2: Populate Products Database

After the schema is set up, run:

```bash
cd scripts
npx tsx seedCompleteProductDatabase.ts
```

### Step 3: Update Pricing from HTML

After products are populated, run:

```bash
cd scripts  
npx tsx updatePricingFromHTML.ts
```

### Step 4: Verify Database Setup

Run this test to verify everything is working:

```bash
cd scripts
npx tsx testDatabaseConnection.ts
```

## 🚨 Important Notes

1. **Order Matters**: Must run schema first, then products, then pricing
2. **Backup**: Supabase automatically backs up, but be careful with the SQL commands
3. **Permissions**: Make sure your service role key has the right permissions
4. **Pricing**: The HTML pricing sheet has been parsed and will create comprehensive pricing tiers

## 🎯 What This Sets Up

### Database Tables:
- ✅ **products** - Complete product catalog with 29 products
- ✅ **inventory** - Location-based inventory with Phoenix warehouse
- ✅ **pricing_tiers** - Dynamic pricing with volume discounts
- ✅ **orders** - Enhanced with drive-through fields
- ✅ **drive_through_queue** - Real-time queue management
- ✅ **notification_preferences** - SMS/email preferences
- ✅ **inventory_alerts** - Low stock notifications
- ✅ **order_status_history** - Order tracking
- ✅ **notification_log** - Delivery tracking

### Pricing Structure:
- **Retail pricing** (1-3 units)
- **Case pricing** (4+ units)  
- **Distributor pricing** (wholesale customers)
- **Pallet pricing** (bulk orders)
- **Volume discounts** (automatic)
- **Customer type discounts** (contractor, member, wholesale)

### Drive-Through Features:
- **QR code session tracking**
- **Vehicle descriptions** 
- **Parking spot assignment**
- **Queue position management**
- **Arrival notifications**
- **Order preparation timing**

## 🧪 Test the System

After setup, test these endpoints:

1. **Products with pricing**: `GET /api/inventory/products/1?customerType=regular`
2. **Calculate cart pricing**: `POST /api/pricing/cart`
3. **Reserve inventory**: `POST /api/inventory/reserve`
4. **Drive-through queue**: `GET /api/admin/drive-through/queue`

## 🔄 Next Development Steps

1. **Connect QR system** to live database instead of static data
2. **Add SMS notifications** with Twilio
3. **Build admin dashboards** for drive-through management
4. **Implement Stripe POS** integration
5. **Add inventory alerts** and auto-reordering

## 📞 Support

If you encounter any issues:
1. Check Supabase logs in the dashboard
2. Verify environment variables in `server/.env`
3. Ensure all npm packages are installed
4. Check that your Supabase service role key has proper permissions

---

**🎉 Once complete, you'll have a fully functional drive-through ordering system with dynamic pricing, inventory management, and queue tracking!**