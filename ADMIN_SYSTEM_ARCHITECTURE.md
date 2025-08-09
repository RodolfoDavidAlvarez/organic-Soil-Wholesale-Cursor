# Organic Soil Wholesale - Admin Dashboard Architecture

## Overview
Full-featured admin dashboard for managing products, inventory, orders, and drive-through operations.

## Key Features

### 1. Authentication & Security
- Supabase Auth integration with admin role
- Protected routes with middleware
- Admin user: ralvarez@soilseedandwater.com
- Temporary password: Admin2024!Soil
- Session management and secure logout

### 2. Product Management (CMS)
- **CRUD Operations**: Create, Read, Update, Delete products
- **Fields Management**:
  - Basic: name, productType, displayTitle, marketingTitle
  - Descriptions: description, story, marketingNote
  - Images: texturePhotoUrl, imageUrl, additionalImages[], productVideoUrl
  - Categories & Pricing: category, price, sizeOptions[], availableSizeOptions[]
  - Inventory: stockQuantity, minOrderQuantity, maxOrderQuantity
  - Features: ingredients, usage, targetAudience, recommendedUses, features
  - SEO: seoKeywords, certifications
  - Wholesale: isWholesaleOnly, isPriceNegotiable, requiresQuote, allowBulkPickup
- **Bulk Operations**: Import/Export CSV, Batch updates
- **Image Management**: Upload, optimize, reorder images

### 3. Inventory Management
- **Location-Based Tracking**: Phoenix warehouse, other locations
- **Real-time Updates**: Stock levels, reservations
- **Drive-Through Integration**:
  - Track pickup orders
  - Manage reserved inventory
  - Quick fulfillment interface
- **Alerts**: Low stock, reorder points
- **Transactions Log**: All inventory movements

### 4. Order Management
- **Order Types**: Standard, Quick Order (Drive-through), POS
- **Order Status Workflow**:
  - Pending → Reserved → Picked → Completed
  - Drive-through specific: Ready for pickup → Picked up
- **Features**:
  - Search and filter orders
  - Edit order details
  - Print pick lists
  - Generate confirmation codes
  - Track payment status

### 5. Drive-Through Operations
- **Dedicated Dashboard**: Real-time pickup queue
- **Quick Actions**:
  - Mark order ready
  - Complete pickup
  - Cancel/modify orders
- **Mobile-Optimized**: For warehouse staff tablets
- **Customer Notifications**: SMS/Email when ready

### 6. Analytics & Reporting
- **Sales Metrics**: Daily/Weekly/Monthly revenue
- **Product Analytics**: Best sellers, slow movers
- **Inventory Reports**: Stock levels, turnover
- **Drive-Through Metrics**: Average pickup time, peak hours
- **Customer Insights**: Repeat customers, order patterns

### 7. User Management
- **Wholesale Approvals**: Review and approve applications
- **Customer Database**: Contact info, order history
- **Admin Roles**: Super admin, inventory manager, order processor

### 8. Settings & Configuration
- **Business Settings**: Hours, locations, contact info
- **Delivery Zones**: Manage zones and pricing
- **Pricing Tiers**: Volume discounts
- **Email Templates**: Order confirmations, notifications

## Technical Implementation

### Database Schema Updates
```sql
-- Admin users table
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Audit log for tracking changes
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Routes Structure
```
/admin
  /login - Admin authentication
  /dashboard - Overview with key metrics
  /products - Product management
  /inventory - Inventory tracking
  /orders - Order management
  /drive-through - Drive-through operations
  /customers - Customer management
  /analytics - Reports and insights
  /settings - System configuration
```

### Security Measures
- Role-based access control (RBAC)
- API rate limiting
- Audit logging for all actions
- Secure file uploads
- CSRF protection

## Implementation Priority
1. Authentication setup with Supabase
2. Product CRUD interface
3. Inventory management
4. Order processing
5. Drive-through dashboard
6. Analytics and reporting
7. Advanced features

## Mobile Considerations
- Responsive design for tablets/phones
- Touch-optimized interfaces
- Offline capability for critical operations
- Progressive Web App (PWA) features