# Admin Landing Page Integration Plan

## Overview

Integrate the admin system with representative landing pages so that:

- **Admins** can have their own landing pages (like representatives)
- Contacts submitted from admin landing pages are associated with that admin
- **Regular admins** only see contacts from their own landing page
- **Super admins** see all contacts from all landing pages

## Database Schema Changes

### 1. Update `admin_users` table

Add landing page fields to allow admins to have public landing pages:

```sql
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_button_text VARCHAR(100) DEFAULT 'Contact Me',
ADD COLUMN IF NOT EXISTS contact_card_button_text VARCHAR(100) DEFAULT 'Download Contact Card',
ADD COLUMN IF NOT EXISTS contact_form_title VARCHAR(100) DEFAULT 'Get In Touch',
ADD COLUMN IF NOT EXISTS contact_form_description TEXT,
ADD COLUMN IF NOT EXISTS has_landing_page BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_admin_users_slug ON admin_users(slug);
```

### 2. Update `representative_contacts` table

Add `admin_id` to link contacts to admins (in addition to representatives):

```sql
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE;

-- Make representative_id nullable (contacts can come from either)
ALTER TABLE representative_contacts
ALTER COLUMN representative_id DROP NOT NULL;

-- Add constraint: either representative_id OR admin_id must be set
ALTER TABLE representative_contacts
ADD CONSTRAINT check_contact_source
CHECK (
  (representative_id IS NOT NULL AND admin_id IS NULL) OR
  (representative_id IS NULL AND admin_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_representative_contacts_admin_id ON representative_contacts(admin_id);
```

## API Changes

### 1. Update Contact Submission Route

`POST /api/representatives/:slug/contact` should:

- Check if slug belongs to a representative OR an admin
- Set either `representative_id` or `admin_id` accordingly

### 2. Update Landing Page Route

`GET /api/representatives/:slug` should:

- First check `representatives` table
- If not found, check `admin_users` table (where `has_landing_page = true`)
- Return unified format

### 3. Update CRM Contacts Route

`GET /api/admin/representative-contacts` should:

- **Regular admin**: Filter by `admin_id = req.admin.id`
- **Super admin**: Show all contacts (no filter)

## Frontend Changes

### 1. CRM Contacts Page

- Show badge indicating if contact came from admin or representative
- Filter automatically based on admin role

### 2. Admin Settings/Profile

- Add section to enable landing page
- Form to fill in landing page details (bio, photo, etc.)
- Generate slug automatically from name/email

### 3. Landing Page Component

- Update to work with both representatives and admins
- Same UI, different data source

## Migration Strategy

1. **Phase 1**: Database migration (add columns, make nullable)
2. **Phase 2**: Update backend routes to support both
3. **Phase 3**: Update frontend CRM to filter by role
4. **Phase 4**: Add admin landing page management UI

## Benefits

- ✅ Unified system: Admins and representatives work the same way
- ✅ Role-based filtering: Admins see only their contacts
- ✅ Super admin oversight: Can see all contacts
- ✅ Backward compatible: Existing representatives still work
- ✅ Flexible: Admins can opt-in to landing pages


