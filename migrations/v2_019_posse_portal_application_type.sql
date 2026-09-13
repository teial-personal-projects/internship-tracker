-- v2_019_posse_portal_application_type.sql
-- Adds Posse Portal as an application type.

-- UP
ALTER TYPE application_type_enum ADD VALUE IF NOT EXISTS 'posse_portal';

-- DOWN
-- Postgres enum values cannot be removed safely without rebuilding dependent
-- columns and remapping data. Leave this value in place on rollback.
