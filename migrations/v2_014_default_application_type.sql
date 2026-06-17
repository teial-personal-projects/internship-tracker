-- v2_014_default_application_type.sql
-- Defaults new application records to cold strategic.
-- Requires: v2_002_applications.sql

-- ============================================================
-- UP
-- ============================================================

UPDATE applications
SET application_type = 'cold_strategic'
WHERE application_type IS NULL;

ALTER TABLE applications
  ALTER COLUMN application_type SET DEFAULT 'cold_strategic',
  ALTER COLUMN application_type SET NOT NULL;

-- ============================================================
-- DOWN
-- ============================================================

ALTER TABLE applications
  ALTER COLUMN application_type DROP NOT NULL,
  ALTER COLUMN application_type DROP DEFAULT;
