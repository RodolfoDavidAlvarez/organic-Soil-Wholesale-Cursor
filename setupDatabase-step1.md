# Database Setup - Step 1: Base Tables

Run these in Supabase SQL editor FIRST, before the inventory tables:

## 1. Create Products Table
```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  category VARCHAR(100),
  type VARCHAR(100),
  imageUrl TEXT,
  texturePhotoUrl TEXT,
  sizeOptions TEXT[],
  displayTitle VARCHAR(255),
  briefOverview TEXT,
  slug VARCHAR(255) UNIQUE,
  isWholesaleOnly BOOLEAN DEFAULT false,
  allowBulkPickup BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Create Orders Table
```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2),
  orderItems JSONB,
  deliveryType VARCHAR(50),
  address TEXT,
  pickupLocation VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. Enable Row Level Security
```sql
-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Products are viewable by everyone" ON products
FOR SELECT USING (true);

-- Orders can only be read by their creator (for now, allow all)
CREATE POLICY "Orders are viewable by everyone" ON orders
FOR SELECT USING (true);

-- Allow insert for orders from authenticated or anonymous users
CREATE POLICY "Anyone can create orders" ON orders
FOR INSERT WITH CHECK (true);
```

## After running these, proceed with setupDatabase.md for inventory tables