-- v2_011_import_jobs.sql
-- One-time import of all records from the jobs table into the applications table.
-- The jobs table is read-only during this step — no rows are modified or deleted.
-- Requires: v2_002_applications.sql

-- ============================================================
-- UP
-- ============================================================

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
  NULL,     -- application_type: user sets after import
  '{}',     -- checklist_state: blank for all imported rows
  j.cover_letter,
  j.pay,
  j.notes,
  j.added,
  j.applied_date,
  j.deadline,
  j.created_at,
  j.updated_at
FROM jobs j
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DOWN
-- ============================================================

-- Deletes only the rows that were copied from jobs, identified by matching id.
-- Safe to run multiple times (no rows remain after first run).
DELETE FROM applications
WHERE id IN (SELECT id FROM jobs);
