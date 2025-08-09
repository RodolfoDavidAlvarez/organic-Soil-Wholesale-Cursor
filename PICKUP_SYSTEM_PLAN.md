# Drive-Through Pickup Order System Architecture

## Core Requirements
- **Unified Inventory**: Single source of truth for both drive-through and walk-in POS
- **Real-time Updates**: Inventory changes reflect immediately across all systems
- **Reservation System**: Prepaid orders automatically reserve inventory
- **Stripe Integration**: Simple payment processing for online orders

## Database Design

### 1. Enhanced Inventory Management
```sql
-- Location-specific inventory tracking
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  location_id INTEGER REFERENCES locations(id),
  quantity_available INTEGER NOT NULL,
  quantity_reserved INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

-- Track all inventory movements
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventory(id),
  transaction_type VARCHAR(50), -- 'sale', 'reservation', 'restock', 'adjustment'
  quantity INTEGER NOT NULL,
  order_id INTEGER REFERENCES orders(id),
  pos_transaction_id VARCHAR(255), -- External POS reference
  created_at TIMESTAMP DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  address TEXT,
  type VARCHAR(50) -- 'warehouse', 'retail', 'both'
);
```

### 2. Order Flow States
```
pending_payment → payment_processing → paid → reserved → ready_for_pickup → completed
                                           ↓
                                    (auto-reserve inventory)
```

## System Architecture

### 1. Inventory Sync Strategy
- **Primary Database**: PostgreSQL (Neon) as single source of truth
- **Real-time Updates**: Using database triggers for inventory changes
- **POS Integration**: REST API endpoints for inventory queries and updates
- **Webhook Events**: Notify external systems of inventory changes

### 2. Reservation Logic
```javascript
// When order is paid via Stripe
1. Stripe webhook confirms payment
2. Update order status to 'paid'
3. Reserve inventory (move from available to reserved)
4. Send confirmation email/SMS
5. Add to pickup queue
```

### 3. POS Integration Points
```
GET  /api/inventory/:location_id - Check available inventory
POST /api/inventory/transaction - Record POS sale
GET  /api/inventory/sync - Full inventory sync
POST /api/webhook/inventory - Receive external updates
```

## Implementation Phases

### Phase 1: Database & Core Infrastructure
- Set up real Neon PostgreSQL connection
- Create inventory and location tables
- Implement transaction logging

### Phase 2: Stripe Payment Flow
- Stripe Checkout for product selection
- Webhook handling for payment confirmation
- Automatic inventory reservation on payment

### Phase 3: Inventory Management API
- RESTful endpoints for POS systems
- Real-time inventory queries
- Transaction recording

### Phase 4: Order Management
- Customer order tracking
- Pickup queue management
- SMS/email notifications

### Phase 5: Admin Dashboard
- Real-time inventory levels
- Order queue monitoring
- Manual inventory adjustments

## Initial Product Setup

### Phoenix Location Inventory:
1. **Dan's Gold Dairy Compost**
   - Size: 1 cu ft
   - Stock: 50 units
   - Price: $X.XX

2. **Plant Pal Potting Soil**
   - Size: 2 cu ft
   - Stock: 50 units
   - Price: $X.XX

3. **Oasis Blend (Date/Palm)**
   - Size: 1 cu ft
   - Stock: 50 units
   - Price: $X.XX

## Technical Stack
- **Database**: PostgreSQL (Neon)
- **Backend**: Express + TypeScript
- **Payment**: Stripe Checkout & Webhooks
- **Real-time**: PostgreSQL LISTEN/NOTIFY or Supabase Realtime
- **SMS**: Twilio for pickup notifications
- **Frontend**: React + TypeScript (existing)

## Security Considerations
- API key authentication for POS endpoints
- Idempotent webhook processing
- Transaction isolation for inventory updates
- Rate limiting on public endpoints