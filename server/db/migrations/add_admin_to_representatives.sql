-- Migration: Link Representatives (Contact Cards) to Admins
-- This allows contacts from contact cards to be associated with admins

-- Step 1: Add admin_id to representatives table
-- Note: admin_users.id is UUID type, so admin_id must also be UUID
ALTER TABLE representatives
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_representatives_admin_id ON representatives(admin_id) WHERE admin_id IS NOT NULL;

-- Step 2: Update representative_contacts to populate admin_id from representative
-- This ensures existing contacts get linked to admins via their representative
UPDATE representative_contacts rc
SET admin_id = r.admin_id
FROM representatives r
WHERE rc.representative_id = r.id
  AND r.admin_id IS NOT NULL
  AND rc.admin_id IS NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN representatives.admin_id IS 'Links contact card to admin user. Contacts from this card will be associated with this admin.';

-- Note: The representative_contacts table already has admin_id column from previous migration
-- This migration just ensures representatives are linked to admins

