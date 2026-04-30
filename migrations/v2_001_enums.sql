-- v2_001_enums.sql
-- Creates all custom enum types required for v2 tables.
-- Does not modify any existing types (e.g. job_status_enum).
-- Wrapped in DO blocks so the script is safe to re-run.

-- ============================================================
-- UP
-- ============================================================

DO $$ BEGIN
  CREATE TYPE application_status_enum AS ENUM (
    'not_started', 'in_progress', 'applied', 'screening', 'interviewing',
    'technical', 'on_site', 'final_round', 'offered', 'rejected',
    'withdrawn', 'archive'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_type_enum AS ENUM (
    'cold_strategic', 'recruiter_assisted', 'referral', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_type_enum AS ENUM (
    'company_contact', 'recruiter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE outreach_status_enum AS ENUM (
    'not_contacted', 'applied_msg_sent', 'double_down_sent',
    'follow_up_sent', 'replied', 'no_response'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recruiter_status_enum AS ENUM (
    'active', 'inactive', 'follow_up_needed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_type_enum AS ENUM (
    'phone_screen', 'technical', 'on_site', 'final_round', 'screening'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_status_enum AS ENUM (
    'scheduled', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_outcome_enum AS ENUM (
    'passed', 'rejected', 'withdrawn', 'no_decision_yet'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_category_enum AS ENUM (
    'application', 'outreach', 'research', 'interview_prep', 'recruiter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority_enum AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('open', 'complete', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_interaction_type_enum AS ENUM (
    'application_message', 'double_down', 'follow_up', 'reply_received',
    'phone_screen_confirmed', 'initial_contact', 'role_discussion',
    'resume_submitted', 'role_update', 'feedback_received', 'note'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_template_type_enum AS ENUM (
    'email_format', 'resume_version', 'intro_pitch', 'cover_letter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE preferred_contact_method_enum AS ENUM (
    'email', 'linkedin', 'phone', 'text'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE how_found_enum AS ENUM (
    'linkedin', 'company_site', 'referral', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    'overdue_task', 'upcoming_interview', 'follow_up_due', 'recruiter_no_response'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- DOWN
-- ============================================================

DROP TYPE IF EXISTS notification_type_enum;
DROP TYPE IF EXISTS how_found_enum;
DROP TYPE IF EXISTS preferred_contact_method_enum;
DROP TYPE IF EXISTS contact_template_type_enum;
DROP TYPE IF EXISTS contact_interaction_type_enum;
DROP TYPE IF EXISTS task_status_enum;
DROP TYPE IF EXISTS task_priority_enum;
DROP TYPE IF EXISTS task_category_enum;
DROP TYPE IF EXISTS interview_outcome_enum;
DROP TYPE IF EXISTS interview_status_enum;
DROP TYPE IF EXISTS interview_type_enum;
DROP TYPE IF EXISTS recruiter_status_enum;
DROP TYPE IF EXISTS outreach_status_enum;
DROP TYPE IF EXISTS contact_type_enum;
DROP TYPE IF EXISTS application_type_enum;
DROP TYPE IF EXISTS application_status_enum;
