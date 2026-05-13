-- v2_002_applications.sql
-- Creates the applications table — the v2 replacement for the jobs table.
-- The jobs table is not modified by this migration.
-- Requires: v2_001_enums.sql

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company          TEXT NOT NULL CHECK (char_length(company) <= 200),
  title            TEXT NOT NULL CHECK (char_length(title) <= 200),
  industry         TEXT CHECK (char_length(industry) <= 100),
  location         TEXT CHECK (char_length(location) <= 200),
  job_link         TEXT CHECK (job_link IS NULL OR job_link LIKE 'http%'),
  app_link         TEXT CHECK (app_link IS NULL OR app_link LIKE 'http%'),
  status           application_status_enum NOT NULL DEFAULT 'not_started',
  application_type application_type_enum,
  checklist_state  JSONB NOT NULL DEFAULT '{}',
  cover_letter     TEXT CHECK (char_length(cover_letter) <= 5000),
  notes            TEXT CHECK (char_length(notes) <= 5000),
  pay              TEXT,
  applied_date     DATE,
  deadline         DATE,
  added            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reuse the shared update_updated_at() function from v1
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reuse the shared auto_applied_date() function from v1
CREATE TRIGGER applications_applied_date
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION auto_applied_date();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id
  ON applications(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_application_type
  ON applications(application_type);

CREATE INDEX IF NOT EXISTS idx_applications_added
  ON applications(added DESC);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.applications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.applications TO service_role;

-- Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select" ON applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "applications_insert" ON applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update" ON applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete" ON applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS applications CASCADE;
