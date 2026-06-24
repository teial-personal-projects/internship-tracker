-- radar_002_radar_criteria.sql
-- Adds per-user configurable Job Radar match criteria.
-- Requires: radar_001_job_radar.sql

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS radar_criteria (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  title_terms      TEXT[] NOT NULL DEFAULT '{}',
  field_terms      TEXT[] NOT NULL DEFAULT '{}',
  include_keywords TEXT[] NOT NULL DEFAULT '{}',
  exclude_keywords TEXT[] NOT NULL DEFAULT '{}',
  seniority_terms  TEXT[] NOT NULL DEFAULT '{}',
  location_terms   TEXT[] NOT NULL DEFAULT '{}',
  location_rules   TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT radar_criteria_location_rules_valid
    CHECK (location_rules <@ ARRAY['remote_us', 'onsite']::TEXT[])
);

CREATE TRIGGER radar_criteria_updated_at
  BEFORE UPDATE ON radar_criteria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.radar_criteria FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.radar_criteria TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.radar_criteria TO service_role;

-- Row Level Security
ALTER TABLE radar_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radar_criteria_select" ON radar_criteria
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "radar_criteria_insert" ON radar_criteria
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "radar_criteria_update" ON radar_criteria
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "radar_criteria_delete" ON radar_criteria
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS radar_criteria CASCADE;
