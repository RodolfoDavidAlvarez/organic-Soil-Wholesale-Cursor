-- Adds support for storing multiple video URLs per representative contact card
ALTER TABLE representatives
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE representatives
  ALTER COLUMN contact_button_text SET DEFAULT 'Enter Your Contact Details';

UPDATE representatives
SET contact_button_text = 'Enter Your Contact Details'
WHERE contact_button_text IS NULL
   OR trim(contact_button_text) = ''
   OR contact_button_text = 'Contact Me';
