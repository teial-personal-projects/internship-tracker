-- v2_005_contact_templates.sql
-- Creates the contact_templates table — reusable message templates per contact.
-- Requires: v2_001_enums.sql, v2_003_contacts.sql

-- ============================================================
-- UP
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
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS contact_templates CASCADE;
