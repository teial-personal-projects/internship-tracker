-- v2_009_notifications.sql
-- Creates notification_preferences (one row per user) and notification_log (in-app inbox).
-- In-app only — no email fields, no digest, no quiet hours.
-- Requires: v2_001_enums.sql

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled                     BOOLEAN NOT NULL DEFAULT true,
  notify_overdue_tasks        BOOLEAN NOT NULL DEFAULT true,
  notify_upcoming_interviews  BOOLEAN NOT NULL DEFAULT true,
  notify_follow_up_due        BOOLEAN NOT NULL DEFAULT true,
  notify_recruiter_no_response BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Unique index on user_id (enforces one preferences row per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_prefs_user_id
  ON notification_preferences(user_id);

-- Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type_enum NOT NULL,
  source_id         UUID,
  message           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at           TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id
  ON notification_log(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_created_at
  ON notification_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_source_id
  ON notification_log(source_id);

-- Row Level Security
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_select" ON notification_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_log_insert" ON notification_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_log_update" ON notification_log
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_log_delete" ON notification_log
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS notification_log CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
