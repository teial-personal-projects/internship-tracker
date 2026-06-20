-- v2_016_company_watchlist_target_apply_date.sql
-- Converts Companies To Watch planning from target apply year to target apply date.
-- Requires: v2_010_company_watchlist.sql

-- ============================================================
-- UP
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
-- DOWN
-- ============================================================

ALTER TABLE company_watchlist
  ADD COLUMN IF NOT EXISTS target_apply_year SMALLINT
    CHECK (target_apply_year BETWEEN 2020 AND 2100);

UPDATE company_watchlist
SET target_apply_year = EXTRACT(YEAR FROM target_apply_date)::SMALLINT
WHERE target_apply_year IS NULL
  AND target_apply_date IS NOT NULL;

ALTER TABLE company_watchlist
  DROP COLUMN IF EXISTS target_apply_date;
