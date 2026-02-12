-- Add BOL-COD associations and client tagging
-- This migration connects BOLs and CODs together and adds client grouping

-- Link CODs to BOLs (a COD can reference which BOL delivery it documents)
ALTER TABLE ops_cods ADD COLUMN IF NOT EXISTS bol_id INTEGER REFERENCES ops_bols(id);
CREATE INDEX IF NOT EXISTS idx_ops_cods_bol_id ON ops_cods(bol_id);

-- Add client tagging for grouping by deal/client
ALTER TABLE ops_bols ADD COLUMN IF NOT EXISTS client_tag TEXT;
ALTER TABLE ops_cods ADD COLUMN IF NOT EXISTS client_tag TEXT;
CREATE INDEX IF NOT EXISTS idx_ops_bols_client_tag ON ops_bols(client_tag);
CREATE INDEX IF NOT EXISTS idx_ops_cods_client_tag ON ops_cods(client_tag);

-- Add comments
COMMENT ON COLUMN ops_cods.bol_id IS 'Optional FK linking this COD to the BOL it documents';
COMMENT ON COLUMN ops_bols.client_tag IS 'Client grouping tag: vanguard, willcox, 3lag, etc.';
COMMENT ON COLUMN ops_cods.client_tag IS 'Client grouping tag: vanguard, willcox, 3lag, etc.';
