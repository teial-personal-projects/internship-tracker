-- Run this in both dev and prod Supabase SQL Editor tabs, then compare rows
-- where status = 'missing'. This is a targeted audit for Track My Application
-- production rollout readiness; use scripts/schema-diff.sh for a full diff.

WITH expected_tables(table_name) AS (
  VALUES
    ('applications'),
    ('contacts'),
    ('contact_interactions'),
    ('application_contacts'),
    ('tasks'),
    ('interviews'),
    ('notification_preferences'),
    ('notification_log'),
    ('company_watchlist'),
    ('application_events'),
    ('discovered_postings'),
    ('radar_criteria')
),
expected_columns(table_name, column_name) AS (
  VALUES
    ('applications', 'source'),
    ('applications', 'source_metadata'),
    ('applications', 'application_type'),
    ('applications', 'applied_date'),
    ('applications', 'deadline'),
    ('applications', 'added'),
    ('applications', 'updated_at'),
    ('contacts', 'company'),
    ('company_watchlist', 'target_apply_date'),
    ('company_watchlist', 'ats_type'),
    ('company_watchlist', 'ats_board_token'),
    ('company_watchlist', 'radar_enabled'),
    ('company_watchlist', 'last_refreshed_at'),
    ('discovered_postings', 'watchlist_id'),
    ('discovered_postings', 'external_job_id'),
    ('discovered_postings', 'status'),
    ('radar_criteria', 'include_keywords'),
    ('radar_criteria', 'exclude_keywords'),
    ('radar_criteria', 'seniority_terms'),
    ('radar_criteria', 'location_rules')
),
expected_enum_values(type_name, enum_value) AS (
  VALUES
    ('application_source_enum', 'manual'),
    ('application_source_enum', 'imported'),
    ('application_source_enum', 'watchlist'),
    ('application_source_enum', 'radar'),
    ('application_status_enum', 'not_started'),
    ('application_status_enum', 'in_progress'),
    ('application_status_enum', 'applied'),
    ('application_status_enum', 'screening'),
    ('application_status_enum', 'interviewing'),
    ('application_status_enum', 'technical'),
    ('application_status_enum', 'on_site'),
    ('application_status_enum', 'final_round'),
    ('application_status_enum', 'offered'),
    ('application_status_enum', 'rejected'),
    ('application_status_enum', 'withdrawn'),
    ('application_status_enum', 'archive'),
    ('interview_type_enum', 'phone_screen'),
    ('interview_type_enum', 'technical'),
    ('interview_type_enum', 'on_site'),
    ('interview_type_enum', 'final_round'),
    ('interview_type_enum', 'screening'),
    ('interview_type_enum', 'coding'),
    ('interview_type_enum', 'system_design'),
    ('interview_type_enum', 'behavioral'),
    ('interview_type_enum', 'recruiter_screen'),
    ('interview_type_enum', 'hiring_manager'),
    ('interview_type_enum', 'final'),
    ('ats_type_enum', 'greenhouse'),
    ('ats_type_enum', 'lever'),
    ('ats_type_enum', 'ashby'),
    ('ats_type_enum', 'smartrecruiters'),
    ('ats_type_enum', 'pinpoint'),
    ('ats_type_enum', 'welcomekit'),
    ('ats_type_enum', 'custom'),
    ('posting_status_enum', 'new'),
    ('posting_status_enum', 'seen'),
    ('posting_status_enum', 'dismissed'),
    ('posting_status_enum', 'promoted')
),
expected_indexes(index_name) AS (
  VALUES
    ('idx_applications_source'),
    ('idx_applications_user_status'),
    ('idx_applications_user_applied_date'),
    ('idx_applications_user_updated_at'),
    ('idx_tasks_user_status_priority'),
    ('idx_interviews_user_status_sched'),
    ('idx_contacts_user_last_outreach'),
    ('idx_application_events_user_occurred_at'),
    ('idx_discovered_postings_user_id'),
    ('idx_discovered_postings_status'),
    ('idx_discovered_postings_first_seen_at'),
    ('idx_discovered_postings_watchlist_id')
),
expected_triggers(table_name, trigger_name) AS (
  VALUES
    ('applications', 'applications_updated_at'),
    ('applications', 'applications_applied_date'),
    ('contacts', 'contacts_updated_at'),
    ('tasks', 'tasks_updated_at'),
    ('interviews', 'interviews_updated_at'),
    ('company_watchlist', 'company_watchlist_updated_at'),
    ('discovered_postings', 'discovered_postings_updated_at'),
    ('radar_criteria', 'radar_criteria_updated_at')
)
SELECT
  'table' AS section,
  table_name AS object_name,
  table_name AS detail,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name = expected_tables.table_name
    )
    THEN 'present'
    ELSE 'missing'
  END AS status
FROM expected_tables

UNION ALL

SELECT
  'column' AS section,
  expected_columns.table_name || '.' || expected_columns.column_name AS object_name,
  expected_columns.table_name || '.' || expected_columns.column_name AS detail,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = expected_columns.table_name
        AND c.column_name = expected_columns.column_name
    )
    THEN 'present'
    ELSE 'missing'
  END AS status
FROM expected_columns

UNION ALL

SELECT
  'enum_value' AS section,
  expected_enum_values.type_name || '.' || expected_enum_values.enum_value AS object_name,
  expected_enum_values.type_name || '.' || expected_enum_values.enum_value AS detail,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      JOIN pg_enum en ON en.enumtypid = typ.oid
      WHERE ns.nspname = 'public'
        AND typ.typname = expected_enum_values.type_name
        AND en.enumlabel = expected_enum_values.enum_value
    )
    THEN 'present'
    ELSE 'missing'
  END AS status
FROM expected_enum_values

UNION ALL

SELECT
  'index' AS section,
  index_name AS object_name,
  index_name AS detail,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_indexes i
      WHERE i.schemaname = 'public'
        AND i.indexname = expected_indexes.index_name
    )
    THEN 'present'
    ELSE 'missing'
  END AS status
FROM expected_indexes

UNION ALL

SELECT
  'trigger' AS section,
  expected_triggers.table_name || '.' || expected_triggers.trigger_name AS object_name,
  expected_triggers.table_name || '.' || expected_triggers.trigger_name AS detail,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.triggers tr
      WHERE tr.trigger_schema = 'public'
        AND tr.event_object_table = expected_triggers.table_name
        AND tr.trigger_name = expected_triggers.trigger_name
    )
    THEN 'present'
    ELSE 'missing'
  END AS status
FROM expected_triggers
ORDER BY section, object_name;
