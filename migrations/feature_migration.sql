-- feature_migration.sql
-- Consolidated production migration for the Radar valid-postings feature branch.
-- Keep this file in sync with prod_full_v2_schema.sql while this branch is in development.

-- ============================================================
-- Source tier and validity enums
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

-- ============================================================
-- Watchlist and discovered posting provenance
-- ============================================================

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
-- Global Radar source catalog
-- ============================================================

CREATE TABLE IF NOT EXISTS radar_sources (
  id                              TEXT PRIMARY KEY,
  source_name                     TEXT NOT NULL CHECK (char_length(source_name) <= 100),
  source_tier                     source_tier_enum NOT NULL,
  adapter_type                    TEXT CHECK (adapter_type IS NULL OR btrim(adapter_type) <> ''),
  supports_direct_validity_checks BOOLEAN NOT NULL DEFAULT false,
  is_active                       BOOLEAN NOT NULL DEFAULT true,
  metadata                        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT radar_sources_direct_validity_adapter
    CHECK (NOT supports_direct_validity_checks OR adapter_type IS NOT NULL)
);

DROP TRIGGER IF EXISTS radar_sources_updated_at ON radar_sources;
CREATE TRIGGER radar_sources_updated_at
  BEFORE UPDATE ON radar_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_radar_sources_source_tier
  ON radar_sources(source_tier);

CREATE INDEX IF NOT EXISTS idx_radar_sources_active
  ON radar_sources(is_active);

REVOKE ALL PRIVILEGES ON TABLE public.radar_sources FROM anon, authenticated;
GRANT SELECT ON TABLE public.radar_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.radar_sources TO service_role;

ALTER TABLE radar_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "radar_sources_select" ON radar_sources;
CREATE POLICY "radar_sources_select" ON radar_sources
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Source seed data
-- ============================================================

INSERT INTO radar_sources (
  id,
  source_name,
  source_tier,
  adapter_type,
  supports_direct_validity_checks
) VALUES
  ('greenhouse', 'Greenhouse', 'direct_ats', 'greenhouse', true),
  ('lever', 'Lever', 'direct_ats', 'lever', true),
  ('ashby', 'Ashby', 'direct_ats', 'ashby', true),
  ('smartrecruiters', 'SmartRecruiters', 'direct_ats', 'smartrecruiters', true),
  ('pinpoint', 'Pinpoint', 'direct_ats', 'pinpoint', false),
  ('welcomekit', 'Welcome Kit', 'direct_ats', 'welcomekit', false),
  ('custom', 'Custom careers page', 'direct_ats', 'custom', false),
  ('linkedin', 'LinkedIn', 'curated_board', null, false),
  ('we_work_remotely', 'We Work Remotely', 'curated_board', null, false),
  ('working_nomads', 'Working Nomads', 'curated_board', null, false),
  ('remote_co', 'Remote.co', 'curated_board', null, false),
  ('idealist', 'Idealist', 'curated_board', null, false),
  ('indeed', 'Indeed', 'aggregator', null, false),
  ('ziprecruiter', 'ZipRecruiter', 'aggregator', null, false)
ON CONFLICT (id) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_tier = EXCLUDED.source_tier,
  adapter_type = EXCLUDED.adapter_type,
  supports_direct_validity_checks = EXCLUDED.supports_direct_validity_checks,
  is_active = true,
  updated_at = now();

DELETE FROM radar_sources
WHERE id IN (
  'flexjobs',
  'talent',
  'monster',
  'jooble',
  'jora',
  'lensa'
);
