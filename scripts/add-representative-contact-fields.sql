-- Add missing contact form fields to representatives table
-- Run this in Supabase SQL Editor if the columns are missing

ALTER TABLE representatives
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contact_button_text TEXT DEFAULT 'Contact Me' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_card_button_text TEXT DEFAULT 'Download Contact Card' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_form_title TEXT DEFAULT 'Get In Touch' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_form_description TEXT;

-- Update existing rows to have default values if they're null
UPDATE representatives
SET 
  contact_button_text = COALESCE(contact_button_text, 'Contact Me'),
  contact_card_button_text = COALESCE(contact_card_button_text, 'Download Contact Card'),
  contact_form_title = COALESCE(contact_form_title, 'Get In Touch')
WHERE 
  contact_button_text IS NULL 
  OR contact_card_button_text IS NULL 
  OR contact_form_title IS NULL;


