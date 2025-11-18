-- Migration: Link Representatives (Contact Cards) to Admins
-- This allows contacts from contact cards to be associated with admins
-- FIXED: Uses UUID instead of INTEGER to match admin_users.id type

-- Step 1: Add admin_id to representatives table
-- Note: admin_users.id is UUID type, so admin_id must also be UUID
ALTER TABLE representatives
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_representatives_admin_id ON representatives(admin_id) WHERE admin_id IS NOT NULL;

-- Step 2: Check and fix representative_contacts.admin_id if it exists with wrong type
DO $$
BEGIN
  -- Check if admin_id column exists and what type it is
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'representative_contacts' 
    AND column_name = 'admin_id'
  ) THEN
    -- Check if it's the wrong type (INTEGER)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'representative_contacts' 
      AND column_name = 'admin_id'
      AND data_type = 'integer'
    ) THEN
      -- Drop the old column and recreate with correct type
      ALTER TABLE representative_contacts DROP COLUMN admin_id;
      ALTER TABLE representative_contacts 
      ADD COLUMN admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_representative_contacts_admin_id 
      ON representative_contacts(admin_id) WHERE admin_id IS NOT NULL;
    END IF;
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE representative_contacts 
    ADD COLUMN admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_representative_contacts_admin_id 
    ON representative_contacts(admin_id) WHERE admin_id IS NOT NULL;
  END IF;
END $$;

-- Step 3: Update representative_contacts to populate admin_id from representative
-- This ensures existing contacts get linked to admins via their representative
UPDATE representative_contacts rc
SET admin_id = r.admin_id
FROM representatives r
WHERE rc.representative_id = r.id
  AND r.admin_id IS NOT NULL
  AND rc.admin_id IS NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN representatives.admin_id IS 'Links contact card to admin user. Contacts from this card will be associated with this admin.';


