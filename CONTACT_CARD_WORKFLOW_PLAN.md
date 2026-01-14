# Contact Card Workflow Plan

## Overview
- Representatives are now called "Contact Cards"
- Each Contact Card is linked to an Admin (optional, but recommended)
- Contacts from Contact Card landing pages are associated with the linked Admin
- Admins see only contacts from their Contact Cards
- Super Admins see all contacts

## Database Changes

### 1. Add `admin_id` to `representatives` table
```sql
ALTER TABLE representatives
ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_representatives_admin_id ON representatives(admin_id) WHERE admin_id IS NOT NULL;
```

### 2. Update `representative_contacts` to link via admin
When a contact is submitted from a Contact Card:
- `representative_id` = the contact card's ID
- `admin_id` = the contact card's `admin_id` (if set)

This way, we can filter by admin_id in CRM.

## Workflow

### Creating a Contact Card
1. Click "Add Contact Card" button
2. Modal opens: "Create Contact Card"
3. **First field**: "Select Admin" (dropdown)
   - Lists all active admins
   - Subtle "No Admin" option at bottom (not default)
   - Default: empty/placeholder
4. Required fields (with asterisk *):
   - Name *
   - Email *
   - Phone *
   - Slug * (auto-generated from name if not provided)
5. Highly Recommended fields (make it look amazing):
   - Photo URL (shows profile picture)
   - Title (shows under name)
   - Company Name (shows under title)
   - Bio (description text)
   - Banner Image URL (hero banner)
   - Social Links (Facebook, LinkedIn, Instagram, Twitter)
6. Collapsible sections:
   - **Images & Media** (collapsed by default)
     - Gallery Images
   - **Location** (collapsed by default)
     - Address, City, State, Zip Code
   - **Advanced** (collapsed by default)
     - Website
     - Custom Fields
     - Contact Form Description
7. Custom Link field in Social Links section
8. Contact Form Title: Default "Stay In Touch" (not "Get In Touch")

### Contact Submission Flow
1. Prospect visits `/rep/[slug]`
2. Submits contact form
3. Contact saved to `representative_contacts`:
   - `representative_id` = contact card ID
   - `admin_id` = contact card's `admin_id` (if set, otherwise null)
4. In CRM:
   - **Regular Admin**: Sees contacts where `admin_id` = their ID
   - **Super Admin**: Sees all contacts

## UI Changes

### Representatives Page
- Button: "Add Representative" → "Add Contact Card"
- Modal Title: "Create Representative" → "Create Contact Card"
- Form reorganized with sections:
  1. Admin Selection (first, prominent)
  2. Required Information
  3. Recommended Information
  4. Images & Media (collapsible)
  5. Location (collapsible)
  6. Advanced (collapsible)

### Field Indicators
- Required: Red asterisk (*)
- Recommended: Blue info icon or "Recommended" badge
- Optional: No indicator

### Social Links
- Facebook, LinkedIn, Instagram, Twitter
- **Custom Link** field (label + URL)
- Can add multiple custom links

## SQL Migration

See: `server/db/migrations/add_admin_to_representatives.sql`



