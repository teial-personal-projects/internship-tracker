-- prod_import_jobs_to_applications.sql
-- Copies existing v1 jobs into the v2 applications table after
-- migrations/prod_full_v2_schema.sql has already created the full v2 schema.
--
-- This is different from v2_011_import_jobs.sql because this file is intended
-- to run after v2_015_application_source.sql has added source/source_metadata.
-- The jobs table is read-only during this step; no rows are modified or deleted.

INSERT INTO applications (
  id,
  user_id,
  company,
  title,
  industry,
  location,
  job_link,
  app_link,
  status,
  application_type,
  checklist_state,
  cover_letter,
  pay,
  notes,
  added,
  applied_date,
  deadline,
  source,
  source_metadata,
  created_at,
  updated_at
)
SELECT
  j.id,
  j.user_id,
  j.company,
  j.title,
  j.industry,
  j.location,
  j.job_link,
  j.app_link,
  CASE j.status
    WHEN 'not_started'     THEN 'not_started'
    WHEN 'in_progress'     THEN 'in_progress'
    WHEN 'applied'         THEN 'applied'
    WHEN 'interviewing'    THEN 'interviewing'
    WHEN 'offered'         THEN 'offered'
    WHEN 'rejected'        THEN 'rejected'
    WHEN 'underqualified'  THEN 'rejected'
    WHEN 'missed_deadline' THEN 'archive'
    WHEN 'archive'         THEN 'archive'
    ELSE                        'not_started'
  END::application_status_enum,
  'cold_strategic'::application_type_enum,
  '{}'::jsonb,
  j.cover_letter,
  j.pay,
  j.notes,
  j.added,
  j.applied_date,
  j.deadline,
  'imported'::application_source_enum,
  jsonb_build_object('source_table', 'jobs'),
  j.created_at,
  j.updated_at
FROM jobs j
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  company = EXCLUDED.company,
  title = EXCLUDED.title,
  industry = EXCLUDED.industry,
  location = EXCLUDED.location,
  job_link = EXCLUDED.job_link,
  app_link = EXCLUDED.app_link,
  status = EXCLUDED.status,
  application_type = EXCLUDED.application_type,
  checklist_state = EXCLUDED.checklist_state,
  cover_letter = EXCLUDED.cover_letter,
  pay = EXCLUDED.pay,
  notes = EXCLUDED.notes,
  added = EXCLUDED.added,
  applied_date = EXCLUDED.applied_date,
  deadline = EXCLUDED.deadline,
  source = EXCLUDED.source,
  source_metadata = EXCLUDED.source_metadata,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;
