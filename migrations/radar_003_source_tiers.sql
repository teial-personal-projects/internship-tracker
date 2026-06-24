-- radar_003_source_tiers.sql
-- Adds Radar source tier provenance and posting validity metadata.
-- Requires: radar_002_radar_criteria.sql

-- ============================================================
-- UP
-- ============================================================

DO $$
BEGIN
  CREATE TYPE source_tier_enum AS ENUM (
    'direct_ats',
    'curated_board',
    'aggregator'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE posting_validity_status_enum AS ENUM (
    'unchecked',
    'live',
    'closed',
    'not_found',
    'stale',
    'error'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE company_watchlist
  ADD COLUMN IF NOT EXISTS source_tier source_tier_enum NOT NULL DEFAULT 'direct_ats',
  ADD COLUMN IF NOT EXISTS source_name TEXT;

ALTER TABLE discovered_postings
  ADD COLUMN IF NOT EXISTS source_tier source_tier_enum NOT NULL DEFAULT 'direct_ats',
  ADD COLUMN IF NOT EXISTS first_seen_source TEXT NOT NULL DEFAULT 'radar',
  ADD COLUMN IF NOT EXISTS also_seen_on JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_first_seen_at JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validity_status posting_validity_status_enum NOT NULL DEFAULT 'unchecked',
  ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_error TEXT;

CREATE INDEX IF NOT EXISTS idx_discovered_postings_user_source_tier_first_seen
  ON discovered_postings(user_id, source_tier, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovered_postings_user_validity_status
  ON discovered_postings(user_id, validity_status);

-- ============================================================
-- DOWN
-- ============================================================

DROP INDEX IF EXISTS idx_discovered_postings_user_validity_status;
DROP INDEX IF EXISTS idx_discovered_postings_user_source_tier_first_seen;

ALTER TABLE discovered_postings
  DROP COLUMN IF EXISTS validation_error,
  DROP COLUMN IF EXISTS last_validated_at,
  DROP COLUMN IF EXISTS validity_status,
  DROP COLUMN IF EXISTS source_first_seen_at,
  DROP COLUMN IF EXISTS also_seen_on,
  DROP COLUMN IF EXISTS first_seen_source,
  DROP COLUMN IF EXISTS source_tier;

ALTER TABLE company_watchlist
  DROP COLUMN IF EXISTS source_name,
  DROP COLUMN IF EXISTS source_tier;

DROP TYPE IF EXISTS posting_validity_status_enum;
DROP TYPE IF EXISTS source_tier_enum;
