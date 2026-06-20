-- v2_012_application_events.sql
-- Creates the application_events table — application-level interaction timeline.
-- Requires: v2_002_applications.sql, v2_003_contacts.sql

-- ============================================================
-- UP
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
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS application_events CASCADE;
DROP TYPE IF EXISTS application_event_type_enum;
