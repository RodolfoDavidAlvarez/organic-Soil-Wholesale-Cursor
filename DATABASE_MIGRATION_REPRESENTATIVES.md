# Database Migration for Representatives Table

## Issue
The representatives table is missing the contact form fields, causing save errors.

## Solution
Run the SQL migration script to add the missing columns.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Migration**
   - Copy the contents of `scripts/add-representative-contact-fields.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify**
   - The migration will add these columns:
     - `banner_image_url` (TEXT)
     - `gallery_images` (TEXT[])
     - `contact_button_text` (TEXT, default: 'Contact Me')
     - `contact_card_button_text` (TEXT, default: 'Download Contact Card')
     - `contact_form_title` (TEXT, default: 'Get In Touch')
     - `contact_form_description` (TEXT)

4. **Test**
   - Go to `/admin/representatives`
   - Edit a representative
   - Try saving - you should now see success notifications!

## Alternative: Quick SQL

If you prefer, you can run this directly in Supabase SQL Editor:

```sql
ALTER TABLE representatives
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contact_button_text TEXT DEFAULT 'Contact Me' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_card_button_text TEXT DEFAULT 'Download Contact Card' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_form_title TEXT DEFAULT 'Get In Touch' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_form_description TEXT;
```

## What Changed

- ✅ Added on-screen notifications for save operations
- ✅ Better error messages that detect database schema issues
- ✅ Validation feedback for required fields
- ✅ Success/error toasts with clear messaging


