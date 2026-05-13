-- ============================================================
-- Supabase Data API grants for v1 schema
--
-- Run this in the Supabase SQL Editor for each existing v1
-- environment: production and development.
--
-- Safe to re-run:
--   - GRANT and REVOKE are idempotent.
--   - RLS policy creation is guarded by pg_policies checks.
--   - Missing tables are skipped with a NOTICE.
-- ============================================================


-- ------------------------------------------------------------
-- jobs
--
-- User-scoped application records.
-- - anon: no table access.
-- - authenticated: CRUD, constrained by owner-only RLS.
-- - service_role: CRUD for trusted server/admin workflows.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.jobs') IS NULL THEN
    RAISE NOTICE 'Skipping public.jobs because the table does not exist.';
    RETURN;
  END IF;

  REVOKE ALL PRIVILEGES ON TABLE public.jobs FROM anon, authenticated;

  GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.jobs
    TO authenticated;

  GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.jobs
    TO service_role;

  ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
      AND policyname = 'jobs_select'
  ) THEN
    CREATE POLICY "jobs_select"
      ON public.jobs
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
      AND policyname = 'jobs_insert'
  ) THEN
    CREATE POLICY "jobs_insert"
      ON public.jobs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
      AND policyname = 'jobs_update'
  ) THEN
    CREATE POLICY "jobs_update"
      ON public.jobs
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
      AND policyname = 'jobs_delete'
  ) THEN
    CREATE POLICY "jobs_delete"
      ON public.jobs
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ------------------------------------------------------------
-- user_profiles
--
-- One profile row per user.
-- - anon: no table access.
-- - authenticated: read/create/update own profile.
-- - service_role: CRUD for trusted server/admin workflows.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NULL THEN
    RAISE NOTICE 'Skipping public.user_profiles because the table does not exist.';
    RETURN;
  END IF;

  REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM anon, authenticated;

  GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.user_profiles
    TO authenticated;

  GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.user_profiles
    TO service_role;

  ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'profiles_select'
  ) THEN
    CREATE POLICY "profiles_select"
      ON public.user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'profiles_insert'
  ) THEN
    CREATE POLICY "profiles_insert"
      ON public.user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'profiles_update'
  ) THEN
    CREATE POLICY "profiles_update"
      ON public.user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ------------------------------------------------------------
-- job_boards
--
-- Shared read-only reference data.
-- - anon/authenticated: read-only.
-- - service_role: CRUD for trusted maintenance/admin workflows.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.job_boards') IS NULL THEN
    RAISE NOTICE 'Skipping public.job_boards because the table does not exist.';
    RETURN;
  END IF;

  REVOKE ALL PRIVILEGES
    ON TABLE public.job_boards
    FROM anon, authenticated;

  GRANT SELECT
    ON TABLE public.job_boards
    TO anon, authenticated;

  GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.job_boards
    TO service_role;

  ALTER TABLE public.job_boards ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_boards'
      AND policyname = 'job_boards_public_read'
  ) THEN
    CREATE POLICY "job_boards_public_read"
      ON public.job_boards
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
