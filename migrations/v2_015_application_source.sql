-- v2_015_application_source.sql
-- Adds source metadata for applications created manually, imported from jobs,
-- promoted from Companies To Watch, or promoted from Job Radar.
-- Requires: v2_011_import_jobs.sql

-- ============================================================
-- UP
-- ============================================================

DO $$
BEGIN
  CREATE TYPE application_source_enum AS ENUM (
    'manual',
    'imported',
    'watchlist',
    'radar'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS source application_source_enum NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE applications
SET
  source = 'imported',
  source_metadata = jsonb_build_object('source_table', 'jobs')
WHERE id IN (SELECT id FROM jobs);

CREATE INDEX IF NOT EXISTS idx_applications_source
  ON applications(source);

-- ============================================================
-- DOWN
-- ============================================================

DROP INDEX IF EXISTS idx_applications_source;

ALTER TABLE applications
  DROP COLUMN IF EXISTS source_metadata,
  DROP COLUMN IF EXISTS source;

DROP TYPE IF EXISTS application_source_enum;
