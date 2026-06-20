-- radar_001_job_radar.sql
-- Adds manual Job Radar source fields and normalized discovered postings.
-- Requires: v2_010_company_watchlist.sql

-- ============================================================
-- UP
-- ============================================================

DO $$
BEGIN
  CREATE TYPE ats_type_enum AS ENUM (
    'greenhouse',
    'lever',
    'ashby',
    'smartrecruiters',
    'pinpoint',
    'welcomekit',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE posting_status_enum AS ENUM (
    'new',
    'seen',
    'dismissed',
    'promoted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE company_watchlist
  ADD COLUMN IF NOT EXISTS ats_type ats_type_enum,
  ADD COLUMN IF NOT EXISTS ats_board_token TEXT,
  ADD COLUMN IF NOT EXISTS radar_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS discovered_postings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watchlist_id    UUID NOT NULL REFERENCES company_watchlist(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL CHECK (char_length(company_name) <= 200),
  external_job_id TEXT NOT NULL,
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  location        TEXT CHECK (char_length(location) <= 200),
  remote_status   TEXT CHECK (char_length(remote_status) <= 100),
  url             TEXT NOT NULL CHECK (url LIKE 'http%'),
  posted_at       TIMESTAMPTZ,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          posting_status_enum NOT NULL DEFAULT 'new',
  raw_payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT discovered_postings_watchlist_external_unique
    UNIQUE (watchlist_id, external_job_id)
);

CREATE TRIGGER discovered_postings_updated_at
  BEFORE UPDATE ON discovered_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_discovered_postings_user_id
  ON discovered_postings(user_id);

CREATE INDEX IF NOT EXISTS idx_discovered_postings_status
  ON discovered_postings(status);

CREATE INDEX IF NOT EXISTS idx_discovered_postings_first_seen_at
  ON discovered_postings(first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovered_postings_watchlist_id
  ON discovered_postings(watchlist_id);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.discovered_postings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.discovered_postings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.discovered_postings TO service_role;

-- Row Level Security
ALTER TABLE discovered_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovered_postings_select" ON discovered_postings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "discovered_postings_insert" ON discovered_postings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "discovered_postings_update" ON discovered_postings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "discovered_postings_delete" ON discovered_postings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS discovered_postings CASCADE;

ALTER TABLE company_watchlist
  DROP COLUMN IF EXISTS last_refreshed_at,
  DROP COLUMN IF EXISTS radar_enabled,
  DROP COLUMN IF EXISTS ats_board_token,
  DROP COLUMN IF EXISTS ats_type;

DROP TYPE IF EXISTS posting_status_enum;
DROP TYPE IF EXISTS ats_type_enum;
