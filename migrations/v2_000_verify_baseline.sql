-- v2_000_verify_baseline.sql
-- Confirms that the v1 tables exist before any v2 migrations are applied.
-- Run this first. If either query returns 0, stop and investigate before proceeding.
--
-- No DOWN block — this is a read-only verification, nothing to roll back.

-- UP

SELECT COUNT(*) AS jobs_table_exists
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name   = 'jobs';
-- Expected: 1

SELECT COUNT(*) AS job_boards_table_exists
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name   = 'job_boards';
-- Expected: 1
