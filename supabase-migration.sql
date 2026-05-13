-- ============================================================
-- Internship Tracker — Database Migration v1
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TYPE min_year_enum AS ENUM (
  'freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other'
);

CREATE TYPE job_status_enum AS ENUM (
  'not_started', 'in_progress', 'interviewing', 'offered', 'rejected',
  'underqualified', 'missed_deadline', 'applied', 'archive', 'other'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Field length limits are defined in shared/src/constants.ts — keep in sync if changed.
CREATE TABLE jobs (
  id                 UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company            TEXT            NOT NULL CHECK (char_length(company) <= 200),
  title              TEXT            NOT NULL CHECK (char_length(title) <= 200),
  industry           TEXT                     CHECK (industry IS NULL OR char_length(industry) <= 100),
  location           TEXT                     CHECK (location IS NULL OR char_length(location) <= 200),
  min_year           min_year_enum,
  job_link           TEXT                     CHECK (job_link IS NULL OR (job_link ~ '^https?://' AND char_length(job_link) <= 2048)),
  app_link           TEXT                     CHECK (app_link IS NULL OR (app_link ~ '^https?://' AND char_length(app_link) <= 2048)),
  status             job_status_enum NOT NULL DEFAULT 'not_started',
  conference         TEXT                     CHECK (conference IS NULL OR char_length(conference) <= 200),
  cover_letter       TEXT                     CHECK (cover_letter IS NULL OR (cover_letter ~ '^https?://' AND char_length(cover_letter) <= 2048)),
  pay                TEXT                     CHECK (pay IS NULL OR char_length(pay) <= 100),
  notes              TEXT                     CHECK (notes IS NULL OR char_length(notes) <= 5000),
  review             BOOLEAN         NOT NULL DEFAULT FALSE,
  added              DATE            NOT NULL DEFAULT CURRENT_DATE,
  applied_date       DATE,
  deadline           DATE,
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profiles (
  user_id       UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  major         TEXT                   CHECK (major IS NULL OR char_length(major) <= 200),
  current_class min_year_enum,
  positions     TEXT[]        NOT NULL DEFAULT '{}',
  locations     TEXT[]        NOT NULL DEFAULT '{}'
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on jobs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set applied_date when status transitions to 'applied'
CREATE OR REPLACE FUNCTION auto_applied_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'applied'
     AND OLD.status <> 'applied'
     AND NEW.applied_date IS NULL
  THEN
    NEW.applied_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_applied_date
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION auto_applied_date();

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_jobs_user_id     ON jobs(user_id);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_deadline    ON jobs(deadline);
CREATE INDEX idx_jobs_added       ON jobs(added);

-- ============================================================
-- DATA API GRANTS
-- ============================================================

-- jobs: user-scoped only. No anonymous access.
REVOKE ALL PRIVILEGES ON TABLE public.jobs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs TO service_role;

-- user_profiles: user-scoped only. No anonymous access.
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO service_role;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select"  ON jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "jobs_insert"  ON jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_update"  ON jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_delete"  ON jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "profiles_select" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
