-- v2_003_contacts.sql
-- Creates the contacts table (unified company contacts + recruiters).
-- Requires: v2_001_enums.sql, v2_002_applications.sql

-- ============================================================
-- UP
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

-- Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS contacts CASCADE;
DROP FUNCTION IF EXISTS contacts_set_last_outreach();
