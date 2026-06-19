-- v2_017_today_indexes.sql
-- Supporting indexes for the v2.1 Today tab and Applications rail rebuild.
-- Additive only: no tables, columns, or rows are changed.
-- Requires: v2_016_company_watchlist_target_apply_date.sql

-- ============================================================
-- UP
-- ============================================================

-- applications: funnel / pipeline grouping and status filtering
CREATE INDEX IF NOT EXISTS idx_applications_user_status
  ON applications(user_id, status);

-- applications: default list and date filter support
CREATE INDEX IF NOT EXISTS idx_applications_user_applied_date
  ON applications(user_id, applied_date DESC);

-- applications: need-attention ordering
CREATE INDEX IF NOT EXISTS idx_applications_user_updated_at
  ON applications(user_id, updated_at DESC);

-- applications: type filter and no-type nudge count
CREATE INDEX IF NOT EXISTS idx_applications_user_type
  ON applications(user_id, application_type);

-- tasks: open action items by priority and due date
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority
  ON tasks(user_id, status, priority, due_date);

-- interviews: up-next and interviews-this-week reads
CREATE INDEX IF NOT EXISTS idx_interviews_user_status_sched
  ON interviews(user_id, status, scheduled_at);

-- contacts: overdue follow-up reads
CREATE INDEX IF NOT EXISTS idx_contacts_user_outreach
  ON contacts(user_id, outreach_status, date_of_last_outreach);

-- contacts: recent contacts ordering
CREATE INDEX IF NOT EXISTS idx_contacts_user_last_outreach
  ON contacts(user_id, date_of_last_outreach DESC);

-- contact_interactions: future exact-recency follow-up reads
CREATE INDEX IF NOT EXISTS idx_contact_interactions_recency
  ON contact_interactions(contact_id, occurred_at DESC);

-- application_events: Applications rail recent activity
CREATE INDEX IF NOT EXISTS idx_application_events_user_occurred_at
  ON application_events(user_id, occurred_at DESC);

-- ============================================================
-- DOWN
-- ============================================================

DROP INDEX IF EXISTS idx_application_events_user_occurred_at;
DROP INDEX IF EXISTS idx_contact_interactions_recency;
DROP INDEX IF EXISTS idx_contacts_user_last_outreach;
DROP INDEX IF EXISTS idx_contacts_user_outreach;
DROP INDEX IF EXISTS idx_interviews_user_status_sched;
DROP INDEX IF EXISTS idx_tasks_user_status_priority;
DROP INDEX IF EXISTS idx_applications_user_type;
DROP INDEX IF EXISTS idx_applications_user_updated_at;
DROP INDEX IF EXISTS idx_applications_user_applied_date;
DROP INDEX IF EXISTS idx_applications_user_status;
