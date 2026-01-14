-- Clears all representative contact cards and admin landing page data.
-- Run with caution: this permanently deletes contact history.

BEGIN;

-- Remove prospect submissions first (FK references representatives.id)
DELETE FROM representative_contacts;

-- Remove representatives/contact cards from main table
DELETE FROM representatives;

-- Reset admin contact card fields so admins can start fresh
UPDATE admin_users
SET
  slug = NULL,
  phone = NULL,
  bio = NULL,
  photo_url = NULL,
  banner_image_url = NULL,
  gallery_images = ARRAY[]::TEXT[],
  video_urls = ARRAY[]::TEXT[],
  company_name = NULL,
  title = NULL,
  address = NULL,
  city = NULL,
  state = NULL,
  zip_code = NULL,
  website = NULL,
  social_links = '{}'::JSONB,
  contact_button_text = 'Enter Your Contact Details',
  contact_card_button_text = 'Download Contact Card',
  contact_form_title = 'Get In Touch',
  contact_form_description = NULL,
  has_landing_page = FALSE
WHERE slug IS NOT NULL
   OR has_landing_page IS TRUE
   OR phone IS NOT NULL;

COMMIT;
