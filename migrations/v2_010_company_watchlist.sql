-- v2_010_company_watchlist.sql
-- Creates the company_watchlist table — companies to research and apply to in the future.
-- Requires: v2_001_enums.sql

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS company_watchlist (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name       TEXT NOT NULL CHECK (char_length(company_name) <= 200),
  industry           TEXT CHECK (char_length(industry) <= 100),
  website            TEXT CHECK (website IS NULL OR website LIKE 'http%'),
  notes              TEXT CHECK (char_length(notes) <= 5000),
  priority           task_priority_enum,
  target_apply_year  SMALLINT CHECK (target_apply_year BETWEEN 2020 AND 2100),
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
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS company_watchlist CASCADE;
