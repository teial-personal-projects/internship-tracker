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

// V2 field length limits
export const MAX_COVER_LETTER_LENGTH      = 5000;
export const MAX_FIRST_NAME_LENGTH        = 100;
export const MAX_LAST_NAME_LENGTH         = 100;
export const MAX_EMAIL_LENGTH             = 254;
export const MAX_PHONE_LENGTH             = 30;
export const MAX_AGENCY_LENGTH            = 200;
export const MAX_TEMPLATE_NAME_LENGTH     = 200;
export const MAX_TEMPLATE_BODY_LENGTH     = 10000;
export const MAX_INTERACTION_BODY_LENGTH  = 5000;
export const MAX_TASK_TITLE_LENGTH        = 500;
export const MAX_TASK_NOTES_LENGTH        = 2000;
export const MAX_INTERVIEWER_NAMES_LENGTH = 500;
export const TARGET_APPLY_YEAR_MIN        = 2020;
export const TARGET_APPLY_YEAR_MAX        = 2100;
