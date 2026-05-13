-- v2_004_contact_interactions.sql
-- Creates the contact_interactions table — the interaction log for each contact.
-- Requires: v2_001_enums.sql, v2_003_contacts.sql

-- ============================================================
-- UP
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
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS contact_interactions CASCADE;
