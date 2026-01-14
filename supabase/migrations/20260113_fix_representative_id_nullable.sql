-- Make representative_id nullable to support admin-only contact cards
ALTER TABLE representative_contacts ALTER COLUMN representative_id DROP NOT NULL;
