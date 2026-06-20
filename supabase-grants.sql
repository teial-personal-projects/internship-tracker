-- ============================================================
-- Supabase Data API grants for v2 schema
--
-- Run this in the Supabase SQL Editor for each existing v2
-- environment: production and development.
--
-- Safe to re-run:
--   - GRANT and REVOKE are idempotent.
--   - RLS policy creation is guarded by pg_policies checks.
--   - Missing tables are skipped with a NOTICE.
-- ============================================================


CREATE OR REPLACE FUNCTION pg_temp.apply_owner_table_data_api_grants(
  table_name TEXT,
  policy_prefix TEXT,
  allow_update BOOLEAN DEFAULT true,
  allow_delete BOOLEAN DEFAULT true
)
RETURNS void AS $$
DECLARE
  authenticated_privileges TEXT;
BEGIN
  IF to_regclass(format('public.%I', table_name)) IS NULL THEN
    RAISE NOTICE 'Skipping public.% because the table does not exist.', table_name;
    RETURN;
  END IF;

  authenticated_privileges := 'SELECT, INSERT';

  IF allow_update THEN
    authenticated_privileges := authenticated_privileges || ', UPDATE';
  END IF;

  IF allow_delete THEN
    authenticated_privileges := authenticated_privileges || ', DELETE';
  END IF;

  EXECUTE format(
    'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated',
    table_name
  );

  EXECUTE format(
    'GRANT %s ON TABLE public.%I TO authenticated',
    authenticated_privileges,
    table_name
  );

  EXECUTE format(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',
    table_name
  );

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_name
      AND policyname = policy_prefix || '_select'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)',
      policy_prefix || '_select',
      table_name
    );
  END IF;

  EXECUTE format(
    'ALTER POLICY %I ON public.%I TO authenticated',
    policy_prefix || '_select',
    table_name
  );

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_name
      AND policyname = policy_prefix || '_insert'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)',
      policy_prefix || '_insert',
      table_name
    );
  END IF;

  EXECUTE format(
    'ALTER POLICY %I ON public.%I TO authenticated',
    policy_prefix || '_insert',
    table_name
  );

  IF allow_update AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_name
      AND policyname = policy_prefix || '_update'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      policy_prefix || '_update',
      table_name
    );
  END IF;

  IF allow_update THEN
    EXECUTE format(
      'ALTER POLICY %I ON public.%I TO authenticated',
      policy_prefix || '_update',
      table_name
    );
  END IF;

  IF allow_delete AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_name
      AND policyname = policy_prefix || '_delete'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)',
      policy_prefix || '_delete',
      table_name
    );
  END IF;

  IF allow_delete THEN
    EXECUTE format(
      'ALTER POLICY %I ON public.%I TO authenticated',
      policy_prefix || '_delete',
      table_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;


-- v1 baseline tables still present during/after v2 migration.
SELECT pg_temp.apply_owner_table_data_api_grants('jobs', 'jobs');
SELECT pg_temp.apply_owner_table_data_api_grants('user_profiles', 'profiles', true, false);


-- v1/v2 shared reference table.
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

  ALTER POLICY "job_boards_public_read"
    ON public.job_boards
    TO anon, authenticated;
END $$;


-- v2 user-owned tables.
SELECT pg_temp.apply_owner_table_data_api_grants('applications', 'applications');
SELECT pg_temp.apply_owner_table_data_api_grants('contacts', 'contacts');
SELECT pg_temp.apply_owner_table_data_api_grants('contact_interactions', 'contact_interactions');
SELECT pg_temp.apply_owner_table_data_api_grants('contact_templates', 'contact_templates');
SELECT pg_temp.apply_owner_table_data_api_grants(
  'application_contacts',
  'application_contacts',
  false,
  true
);
SELECT pg_temp.apply_owner_table_data_api_grants('tasks', 'tasks');
SELECT pg_temp.apply_owner_table_data_api_grants('interviews', 'interviews');
SELECT pg_temp.apply_owner_table_data_api_grants(
  'notification_preferences',
  'notification_preferences',
  true,
  false
);
SELECT pg_temp.apply_owner_table_data_api_grants('notification_log', 'notification_log');
SELECT pg_temp.apply_owner_table_data_api_grants('company_watchlist', 'company_watchlist');
SELECT pg_temp.apply_owner_table_data_api_grants('application_events', 'application_events');
