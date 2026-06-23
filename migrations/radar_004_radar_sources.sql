-- radar_004_radar_sources.sql
-- Adds global Radar source metadata that can be managed without code changes.
-- Requires: radar_003_source_tiers.sql

-- ============================================================
-- UP
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

CREATE TRIGGER radar_sources_updated_at
  BEFORE UPDATE ON radar_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_radar_sources_source_tier
  ON radar_sources(source_tier);

CREATE INDEX IF NOT EXISTS idx_radar_sources_active
  ON radar_sources(is_active);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.radar_sources FROM anon, authenticated;
GRANT SELECT ON TABLE public.radar_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.radar_sources TO service_role;

-- Row Level Security
ALTER TABLE radar_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radar_sources_select" ON radar_sources
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS radar_sources CASCADE;
