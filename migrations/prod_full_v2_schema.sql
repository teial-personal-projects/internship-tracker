-- prod_full_v2_schema.sql
-- Consolidated Track My Application v2 schema for production rollout.
--
-- Use when production still has only the v1 baseline tables and you want to
-- create the v2 schema in one reviewed pass. This file intentionally excludes
-- migrations/v2_011_import_jobs.sql; run prod_import_jobs_to_applications.sql
-- after this file to copy existing jobs into applications.
--
-- Prerequisites already present in production:
--   - public.jobs
--   - public.job_boards
--   - auth.users


-- ============================================================
-- Shared helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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


-- ============================================================
-- migrations/v2_001_enums.sql
-- ============================================================

-- ============================================================

DO $$ BEGIN
  CREATE TYPE application_status_enum AS ENUM (
    'not_started', 'in_progress', 'applied', 'screening', 'interviewing',
    'technical', 'on_site', 'final_round', 'offered', 'rejected',
    'withdrawn', 'archive'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_type_enum AS ENUM (
    'cold_strategic', 'recruiter_assisted', 'referral', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_type_enum AS ENUM (
    'company_contact', 'recruiter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE outreach_status_enum AS ENUM (
    'not_contacted', 'applied_msg_sent', 'double_down_sent',
    'follow_up_sent', 'replied', 'no_response'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recruiter_status_enum AS ENUM (
    'active', 'inactive', 'follow_up_needed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_type_enum AS ENUM (
    'phone_screen', 'technical', 'on_site', 'final_round', 'screening'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_status_enum AS ENUM (
    'scheduled', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_outcome_enum AS ENUM (
    'passed', 'rejected', 'withdrawn', 'no_decision_yet'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_category_enum AS ENUM (
    'application', 'outreach', 'research', 'interview_prep', 'recruiter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority_enum AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('open', 'complete', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_interaction_type_enum AS ENUM (
    'application_message', 'double_down', 'follow_up', 'reply_received',
    'phone_screen_confirmed', 'initial_contact', 'role_discussion',
    'resume_submitted', 'role_update', 'feedback_received', 'note'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_template_type_enum AS ENUM (
    'email_format', 'resume_version', 'intro_pitch', 'cover_letter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE preferred_contact_method_enum AS ENUM (
    'email', 'linkedin', 'phone', 'text'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE how_found_enum AS ENUM (
    'linkedin', 'company_site', 'referral', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    'overdue_task', 'upcoming_interview', 'follow_up_due', 'recruiter_no_response'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE source_tier_enum AS ENUM (
    'direct_ats', 'curated_board', 'aggregator'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE posting_validity_status_enum AS ENUM (
    'unchecked', 'live', 'closed', 'not_found', 'stale', 'error'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================


-- ============================================================
-- migrations/v2_002_applications.sql
-- ============================================================

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
  application_type application_type_enum NOT NULL DEFAULT 'cold_strategic',
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


-- ============================================================
-- migrations/v2_003_contacts.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS contacts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type             contact_type_enum NOT NULL,
  application_id           UUID REFERENCES applications(id) ON DELETE SET NULL,
  first_name               TEXT NOT NULL CHECK (char_length(first_name) <= 100),
  last_name                TEXT NOT NULL CHECK (char_length(last_name) <= 100),
  title                    TEXT CHECK (char_length(title) <= 200),
  email                    TEXT CHECK (char_length(email) <= 254),
  phone                    TEXT CHECK (char_length(phone) <= 30),
  linkedin_url             TEXT CHECK (linkedin_url IS NULL OR linkedin_url LIKE 'http%'),
  agency                   TEXT CHECK (char_length(agency) <= 200),
  preferred_contact_method preferred_contact_method_enum,
  how_found                how_found_enum,
  outreach_status          outreach_status_enum,
  recruiter_status         recruiter_status_enum,
  notes                    TEXT CHECK (char_length(notes) <= 5000),
  date_of_last_outreach    DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set date_of_last_outreach when outreach_status changes
CREATE OR REPLACE FUNCTION contacts_set_last_outreach()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outreach_status IS DISTINCT FROM OLD.outreach_status
     AND NEW.outreach_status IS NOT NULL
  THEN
    NEW.date_of_last_outreach = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_last_outreach
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION contacts_set_last_outreach();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id
  ON contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_contacts_contact_type
  ON contacts(contact_type);

CREATE INDEX IF NOT EXISTS idx_contacts_application_id
  ON contacts(application_id);

CREATE INDEX IF NOT EXISTS idx_contacts_outreach_status
  ON contacts(outreach_status);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.contacts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contacts TO service_role;

-- Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_004_contact_interactions.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS contact_interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose     contact_interaction_type_enum NOT NULL,
  body        TEXT CHECK (char_length(body) <= 5000),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id
  ON contact_interactions(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_interactions_occurred_at
  ON contact_interactions(occurred_at DESC);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.contact_interactions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_interactions TO service_role;

-- Row Level Security
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_interactions_select" ON contact_interactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "contact_interactions_insert" ON contact_interactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_interactions_update" ON contact_interactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_interactions_delete" ON contact_interactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_005_contact_templates.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS contact_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) <= 200),
  template_type contact_template_type_enum,
  body          TEXT CHECK (char_length(body) <= 10000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER contact_templates_updated_at
  BEFORE UPDATE ON contact_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_templates_contact_id
  ON contact_templates(contact_id);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.contact_templates FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_templates TO service_role;

-- Row Level Security
ALTER TABLE contact_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_templates_select" ON contact_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "contact_templates_insert" ON contact_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_templates_update" ON contact_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_templates_delete" ON contact_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_006_application_contacts.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS application_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  contact_id     UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, contact_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_application_contacts_application_id
  ON application_contacts(application_id);

CREATE INDEX IF NOT EXISTS idx_application_contacts_contact_id
  ON application_contacts(contact_id);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.application_contacts FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.application_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.application_contacts TO service_role;

-- Row Level Security
ALTER TABLE application_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_contacts_select" ON application_contacts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "application_contacts_insert" ON application_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_contacts_delete" ON application_contacts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_007_tasks.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL CHECK (char_length(title) <= 500),
  category         task_category_enum NOT NULL,
  priority         task_priority_enum NOT NULL DEFAULT 'medium',
  status           task_status_enum NOT NULL DEFAULT 'open',
  due_date         DATE,
  application_id   UUID REFERENCES applications(id) ON DELETE SET NULL,
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,
  notes            TEXT CHECK (char_length(notes) <= 2000),
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id
  ON tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_tasks_priority
  ON tasks(priority);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_application_id
  ON tasks(application_id);

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id
  ON tasks(contact_id);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.tasks FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO service_role;

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_008_interviews.sql
-- ============================================================

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


-- ============================================================
-- migrations/v2_009_notifications.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled                     BOOLEAN NOT NULL DEFAULT true,
  notify_overdue_tasks        BOOLEAN NOT NULL DEFAULT true,
  notify_upcoming_interviews  BOOLEAN NOT NULL DEFAULT true,
  notify_follow_up_due        BOOLEAN NOT NULL DEFAULT true,
  notify_recruiter_no_response BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Unique index on user_id (enforces one preferences row per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_prefs_user_id
  ON notification_preferences(user_id);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.notification_preferences FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_preferences TO service_role;

-- Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select" ON notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert" ON notification_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update" ON notification_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type_enum NOT NULL,
  source_id         UUID,
  message           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at           TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id
  ON notification_log(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_created_at
  ON notification_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_source_id
  ON notification_log(source_id);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.notification_log FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_log TO service_role;

-- Row Level Security
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_select" ON notification_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notification_log_insert" ON notification_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_log_update" ON notification_log
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_log_delete" ON notification_log
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_010_company_watchlist.sql
-- ============================================================

-- ============================================================

CREATE TABLE IF NOT EXISTS company_watchlist (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name       TEXT NOT NULL CHECK (char_length(company_name) <= 200),
  industry           TEXT CHECK (char_length(industry) <= 100),
  website            TEXT CHECK (website IS NULL OR website LIKE 'http%'),
  notes              TEXT CHECK (char_length(notes) <= 5000),
  priority           task_priority_enum,
  target_apply_date  DATE,
  source_tier        source_tier_enum NOT NULL DEFAULT 'direct_ats',
  source_name        TEXT,
  added              DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER company_watchlist_updated_at
  BEFORE UPDATE ON company_watchlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_watchlist_user_id
  ON company_watchlist(user_id);

CREATE INDEX IF NOT EXISTS idx_company_watchlist_added
  ON company_watchlist(added DESC);

CREATE INDEX IF NOT EXISTS idx_company_watchlist_priority
  ON company_watchlist(priority);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.company_watchlist FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_watchlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_watchlist TO service_role;

-- Row Level Security
ALTER TABLE company_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_watchlist_select" ON company_watchlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "company_watchlist_insert" ON company_watchlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_watchlist_update" ON company_watchlist
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_watchlist_delete" ON company_watchlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_012_application_events.sql
-- ============================================================

-- ============================================================

CREATE TYPE application_event_type_enum AS ENUM (
  'status_change',
  'company_reached_out',
  'info_requested',
  'document_submitted',
  'offer_received',
  'interview_scheduled',
  'rejection',
  'note'
);

CREATE TABLE IF NOT EXISTS application_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type     application_event_type_enum NOT NULL,
  body           TEXT CHECK (char_length(body) <= 5000),
  contact_id     UUID REFERENCES contacts(id) ON DELETE SET NULL,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_application_events_application_id
  ON application_events(application_id);

CREATE INDEX IF NOT EXISTS idx_application_events_occurred_at
  ON application_events(occurred_at DESC);

-- Data API grants
REVOKE ALL PRIVILEGES ON TABLE public.application_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.application_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.application_events TO service_role;

-- Row Level Security
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_events_select" ON application_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "application_events_insert" ON application_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_events_update" ON application_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_events_delete" ON application_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================


-- ============================================================
-- migrations/v2_013_contacts_company.sql
-- ============================================================

-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS company TEXT CHECK (char_length(company) <= 200);

-- ============================================================


-- ============================================================
-- migrations/v2_014_default_application_type.sql
-- ============================================================

-- ============================================================

UPDATE applications
SET application_type = 'cold_strategic'
WHERE application_type IS NULL;

ALTER TABLE applications
  ALTER COLUMN application_type SET DEFAULT 'cold_strategic',
  ALTER COLUMN application_type SET NOT NULL;

-- ============================================================


-- ============================================================
-- migrations/v2_015_application_source.sql
-- ============================================================

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


-- ============================================================
-- migrations/v2_016_company_watchlist_target_apply_date.sql
-- ============================================================

-- ============================================================

ALTER TABLE company_watchlist
  ADD COLUMN IF NOT EXISTS target_apply_date DATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_watchlist'
      AND column_name = 'target_apply_year'
  ) THEN
    UPDATE company_watchlist
    SET target_apply_date = make_date(target_apply_year, 1, 1)
    WHERE target_apply_date IS NULL
      AND target_apply_year IS NOT NULL;

    ALTER TABLE company_watchlist
      DROP COLUMN target_apply_year;
  END IF;
END $$;

-- ============================================================


-- ============================================================
-- migrations/v2_017_today_indexes.sql
-- ============================================================

-- ============================================================

-- applications: funnel / pipeline grouping and status filtering
CREATE INDEX IF NOT EXISTS idx_applications_user_status
  ON applications(user_id, status);

-- applications: default list and date filter support
CREATE INDEX IF NOT EXISTS idx_applications_user_applied_date
  ON applications(user_id, applied_date DESC);

-- applications: need-attention ordering
CREATE INDEX IF NOT EXISTS idx_applications_user_updated_at
  ON applications(user_id, updated_at DESC);

-- applications: type filter and no-type nudge count
CREATE INDEX IF NOT EXISTS idx_applications_user_type
  ON applications(user_id, application_type);

-- tasks: open action items by priority and due date
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority
  ON tasks(user_id, status, priority, due_date);

-- interviews: up-next and interviews-this-week reads
CREATE INDEX IF NOT EXISTS idx_interviews_user_status_sched
  ON interviews(user_id, status, scheduled_at);

-- contacts: overdue follow-up reads
CREATE INDEX IF NOT EXISTS idx_contacts_user_outreach
  ON contacts(user_id, outreach_status, date_of_last_outreach);

-- contacts: recent contacts ordering
CREATE INDEX IF NOT EXISTS idx_contacts_user_last_outreach
  ON contacts(user_id, date_of_last_outreach DESC);

-- contact_interactions: future exact-recency follow-up reads
CREATE INDEX IF NOT EXISTS idx_contact_interactions_recency
  ON contact_interactions(contact_id, occurred_at DESC);

-- application_events: Applications rail recent activity
CREATE INDEX IF NOT EXISTS idx_application_events_user_occurred_at
  ON application_events(user_id, occurred_at DESC);

-- ============================================================


-- ============================================================
-- migrations/v2_018_interview_type_expansion.sql
-- ============================================================

ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'coding';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'system_design';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'behavioral';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'recruiter_screen';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'hiring_manager';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'final';


-- ============================================================
-- migrations/radar_001_job_radar.sql
-- ============================================================

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
  watchlist_id    UUID REFERENCES company_watchlist(id) ON DELETE CASCADE,
  radar_source_id TEXT,
  company_name    TEXT NOT NULL CHECK (char_length(company_name) <= 200),
  external_job_id TEXT NOT NULL,
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  location        TEXT CHECK (char_length(location) <= 200),
  remote_status   TEXT CHECK (char_length(remote_status) <= 100),
  url             TEXT NOT NULL CHECK (url LIKE 'http%'),
  posted_at       TIMESTAMPTZ,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          posting_status_enum NOT NULL DEFAULT 'new',
  source_tier          source_tier_enum NOT NULL DEFAULT 'direct_ats',
  first_seen_source    TEXT NOT NULL DEFAULT 'radar',
  also_seen_on         JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_first_seen_at JSONB NOT NULL DEFAULT '{}'::jsonb,
  validity_status      posting_validity_status_enum NOT NULL DEFAULT 'unchecked',
  last_validated_at    TIMESTAMPTZ,
  validation_error     TEXT,
  raw_payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
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

CREATE INDEX IF NOT EXISTS idx_discovered_postings_user_source_tier_first_seen
  ON discovered_postings(user_id, source_tier, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovered_postings_user_validity_status
  ON discovered_postings(user_id, validity_status);

CREATE INDEX IF NOT EXISTS idx_discovered_postings_user_radar_source_first_seen
  ON discovered_postings(user_id, radar_source_id, first_seen_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discovered_postings_user_radar_source_external_unique
  ON discovered_postings(user_id, radar_source_id, external_job_id)
  WHERE radar_source_id IS NOT NULL;

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


-- ============================================================
-- migrations/radar_002_radar_criteria.sql
-- ============================================================

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


-- ============================================================
-- migrations/radar_004_radar_sources.sql
-- ============================================================

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

DO $$
BEGIN
  ALTER TABLE discovered_postings
    ADD CONSTRAINT discovered_postings_radar_source_id_fkey
    FOREIGN KEY (radar_source_id) REFERENCES radar_sources(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================


-- ============================================================
-- migrations/radar_005_seed_radar_sources.sql
-- ============================================================

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

-- ============================================================
