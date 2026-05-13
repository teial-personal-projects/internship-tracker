-- v2_006_application_contacts.sql
-- Join table linking recruiter contacts to applications (many-to-many).
-- A recruiter can be linked to multiple applications; an application can have multiple recruiters.
-- Requires: v2_002_applications.sql, v2_003_contacts.sql

-- ============================================================
-- UP
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
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS application_contacts CASCADE;
