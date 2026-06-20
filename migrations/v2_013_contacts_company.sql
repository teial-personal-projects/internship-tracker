-- v2_013_contacts_company.sql
-- Adds a standalone company column to contacts so a contact can belong
-- to a company that isn't linked to an application in the tracker.
-- Requires: v2_003_contacts.sql
--
-- Expected result (UP): "ALTER TABLE" — no error; column visible in
-- Supabase Table Editor under contacts > company (nullable text).

-- ============================================================
-- UP
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS company TEXT CHECK (char_length(company) <= 200);

-- ============================================================
-- DOWN
-- ============================================================

ALTER TABLE contacts DROP COLUMN IF EXISTS company;
