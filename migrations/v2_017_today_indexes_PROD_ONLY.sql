-- v2_017_today_indexes_PROD_ONLY.sql
-- Production-only supporting indexes for the v2.1 Today tab and Applications rail rebuild.
-- Additive only: no tables, columns, or rows are changed.
-- Requires: v2_016_company_watchlist_target_apply_date.sql
--
-- IMPORTANT:
--   Run this file only against a live production database where avoiding long
--   write locks matters. CREATE INDEX CONCURRENTLY cannot run inside a
--   transaction block, so run each statement one at a time in the Supabase SQL
--   Editor or another SQL client configured not to wrap the file in a
--   transaction.
--
--   For local and dev environments, use migrations/v2_017_today_indexes.sql.

-- ============================================================
-- UP
-- ============================================================

-- applications: funnel / pipeline grouping and status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status
  ON applications(user_id, status);

-- applications: default list and date filter support
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_applied_date
  ON applications(user_id, applied_date DESC);

-- applications: need-attention ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_updated_at
  ON applications(user_id, updated_at DESC);

-- applications: type filter and no-type nudge count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_type
  ON applications(user_id, application_type);

-- tasks: open action items by priority and due date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status_priority
  ON tasks(user_id, status, priority, due_date);

-- interviews: up-next and interviews-this-week reads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_user_status_sched
  ON interviews(user_id, status, scheduled_at);

-- contacts: overdue follow-up reads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_outreach
  ON contacts(user_id, outreach_status, date_of_last_outreach);

-- contacts: recent contacts ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_last_outreach
  ON contacts(user_id, date_of_last_outreach DESC);

-- contact_interactions: future exact-recency follow-up reads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_interactions_recency
  ON contact_interactions(contact_id, occurred_at DESC);

-- application_events: Applications rail recent activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_events_user_occurred_at
  ON application_events(user_id, occurred_at DESC);

-- ============================================================
-- DOWN
-- ============================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_application_events_user_occurred_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_contact_interactions_recency;
DROP INDEX CONCURRENTLY IF EXISTS idx_contacts_user_last_outreach;
DROP INDEX CONCURRENTLY IF EXISTS idx_contacts_user_outreach;
DROP INDEX CONCURRENTLY IF EXISTS idx_interviews_user_status_sched;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_status_priority;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_user_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_user_updated_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_user_applied_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_user_status;
