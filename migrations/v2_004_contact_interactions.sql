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

-- Row Level Security
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_interactions_select" ON contact_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contact_interactions_insert" ON contact_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_interactions_update" ON contact_interactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_interactions_delete" ON contact_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS contact_interactions CASCADE;
