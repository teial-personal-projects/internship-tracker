-- v2_008_interviews.sql
-- Creates the interviews table — scheduled and completed interviews per application.
-- Requires: v2_001_enums.sql, v2_002_applications.sql

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS interviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interview_type    interview_type_enum NOT NULL,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  interviewer_names TEXT CHECK (char_length(interviewer_names) <= 500),
  location_link     TEXT CHECK (char_length(location_link) <= 2048),
  notes             TEXT CHECK (char_length(notes) <= 5000),
  status            interview_status_enum NOT NULL DEFAULT 'scheduled',
  outcome           interview_outcome_enum,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user_id
  ON interviews(user_id);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id
  ON interviews(application_id);

CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at
  ON interviews(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_interviews_status
  ON interviews(status);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.interviews FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interviews TO service_role;

-- Row Level Security
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interviews_select" ON interviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "interviews_insert" ON interviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interviews_update" ON interviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interviews_delete" ON interviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS interviews CASCADE;
