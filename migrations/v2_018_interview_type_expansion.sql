-- v2_018_interview_type_expansion.sql
-- Adds more specific interview types while keeping existing values readable.

-- UP
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'coding';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'system_design';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'behavioral';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'recruiter_screen';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'hiring_manager';
ALTER TYPE interview_type_enum ADD VALUE IF NOT EXISTS 'final';

-- DOWN
-- Postgres enum values cannot be removed safely without rebuilding dependent
-- columns and remapping data. Leave these values in place on rollback.
