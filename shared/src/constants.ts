// ============================================================
// Field length limits
// These are the single source of truth — mirrored in:
//   - shared/src/schemas.ts   (Zod / API validation)
//   - web/src/components/JobModal.tsx  (form validation)
//   - supabase-migration.sql  (DB CHECK constraints)
// ============================================================

export const MAX_COMPANY_LENGTH    = 200;
export const MAX_TITLE_LENGTH      = 200;
export const MAX_INDUSTRY_LENGTH   = 100;
export const MAX_LOCATION_LENGTH   = 200;
export const MAX_CONFERENCE_LENGTH = 200;
export const MAX_PAY_LENGTH        = 100;
export const MAX_NOTES_LENGTH      = 5000;
export const MAX_URL_LENGTH        = 2048;
export const MAX_MAJOR_LENGTH      = 200;
