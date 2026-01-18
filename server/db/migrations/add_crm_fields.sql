-- CRM Segmentation System - Database Migration
-- Add fields for segment classification, lead tracking, and email automation
-- Run this in Supabase SQL Editor

-- Add segment classification
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT 'other';

-- Add lead source tracking
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);

-- Add partner ownership (ssw, ufe, both)
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS partner_owner VARCHAR(50) DEFAULT 'ssw';

-- Add context notes (voice memo transcription or typed notes)
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS context_notes TEXT;

-- Add company enrichment data from AI research
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS company_context TEXT;

-- Add pipeline stage (Joe's 4-stage funnel)
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'awareness';

-- Add email tracking fields
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS first_email_sent_at TIMESTAMP;

ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS first_email_body TEXT;

ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS first_email_subject TEXT;

-- Add job title field (currently stored in metadata, move to column for easier queries)
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add website field
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Create index on segment for filtering
CREATE INDEX IF NOT EXISTS idx_representative_contacts_segment
ON representative_contacts(segment);

-- Create index on lead_source for filtering
CREATE INDEX IF NOT EXISTS idx_representative_contacts_lead_source
ON representative_contacts(lead_source);

-- Create index on pipeline_stage for filtering
CREATE INDEX IF NOT EXISTS idx_representative_contacts_pipeline_stage
ON representative_contacts(pipeline_stage);

-- Add comments for documentation
COMMENT ON COLUMN representative_contacts.segment IS 'Demographic segment: operator, municipal, equipment, policy, esg, education, farmer_vineyard, farmer_orchard, farmer_general, waste_hauler, landscaper, other';
COMMENT ON COLUMN representative_contacts.lead_source IS 'Where the lead came from: uscc_2026, skyfire_2026, azcc, referral, website, cold_outreach, other';
COMMENT ON COLUMN representative_contacts.partner_owner IS 'Which partner owns this lead: ssw, ufe, both';
COMMENT ON COLUMN representative_contacts.context_notes IS 'Voice memo transcription or notes from conversation';
COMMENT ON COLUMN representative_contacts.company_context IS 'AI-researched company information from website';
COMMENT ON COLUMN representative_contacts.pipeline_stage IS 'Sales pipeline stage: awareness, interest, consideration, conversion, archived';
