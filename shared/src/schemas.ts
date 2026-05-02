import { z } from 'zod';
import {
  MAX_COMPANY_LENGTH, MAX_TITLE_LENGTH, MAX_INDUSTRY_LENGTH,
  MAX_LOCATION_LENGTH, MAX_CONFERENCE_LENGTH, MAX_PAY_LENGTH,
  MAX_NOTES_LENGTH, MAX_URL_LENGTH, MAX_MAJOR_LENGTH,
  MAX_COVER_LETTER_LENGTH, MAX_FIRST_NAME_LENGTH, MAX_LAST_NAME_LENGTH,
  MAX_EMAIL_LENGTH, MAX_PHONE_LENGTH, MAX_AGENCY_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH, MAX_TEMPLATE_BODY_LENGTH,
  MAX_INTERACTION_BODY_LENGTH, MAX_TASK_TITLE_LENGTH, MAX_TASK_NOTES_LENGTH,
  MAX_INTERVIEWER_NAMES_LENGTH, TARGET_APPLY_YEAR_MIN, TARGET_APPLY_YEAR_MAX,
} from './constants';

const minYearValues = [
  'freshman',
  'sophomore',
  'junior',
  'senior',
  'graduate',
  'other',
] as const;

const jobStatusValues = [
  'not_started',
  'in_progress',
  'interviewing',
  'offered',
  'rejected',
  'underqualified',
  'missed_deadline',
  'applied',
  'archive',
  'other',
] as const;

export const MinYearSchema = z.enum(minYearValues);
export const JobStatusSchema = z.enum(jobStatusValues);

const dateOrEmpty = z.preprocess(
  v => (v === '' ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
);

const urlOrEmpty = z.preprocess(
  v => (v === '' ? null : v),
  z.string().max(MAX_URL_LENGTH).refine(
    (v) => v === null || /^https?:\/\/.+/.test(v),
    { message: 'Must be a valid URL or empty' }
  ).nullable().optional()
);

export const CreateJobSchema = z.object({
  company: z.string().min(1, 'Company is required').max(MAX_COMPANY_LENGTH),
  title: z.string().min(1, 'Title is required').max(MAX_TITLE_LENGTH),
  industry: z.string().max(MAX_INDUSTRY_LENGTH).nullable().optional(),
  location: z.string().max(MAX_LOCATION_LENGTH).nullable().optional(),
  min_year: z.preprocess(v => (v === '' ? null : v), MinYearSchema.nullable().optional()),
  job_link: urlOrEmpty,
  app_link: urlOrEmpty,
  status: JobStatusSchema.default('not_started'),
  conference: z.string().max(MAX_CONFERENCE_LENGTH).nullable().optional(),
  cover_letter: urlOrEmpty, // URL to a cover letter document
  pay: z.string().max(MAX_PAY_LENGTH).nullable().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  review: z.boolean().default(false),
  added: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .default(() => new Date().toISOString().split('T')[0]),
  applied_date: dateOrEmpty,
  deadline: dateOrEmpty,
});

export const UpdateJobSchema = CreateJobSchema.partial();

export const UpdateProfileSchema = z.object({
  major: z.string().max(MAX_MAJOR_LENGTH).nullable().optional(),
  current_class: z.preprocess(v => (v === '' ? null : v), MinYearSchema.nullable().optional()),
  positions: z.array(z.string().max(100)).max(20).default([]),
  locations: z.array(z.string().max(100)).max(20).default([]),
});

export type CreateJobSchemaType = z.infer<typeof CreateJobSchema>;
export type UpdateJobSchemaType = z.infer<typeof UpdateJobSchema>;
export type UpdateProfileSchemaType = z.infer<typeof UpdateProfileSchema>;

// ============================================================
// V2 Enum Schemas
// ============================================================

export const ApplicationStatusSchema = z.enum([
  'not_started', 'in_progress', 'applied', 'screening', 'interviewing',
  'technical', 'on_site', 'final_round', 'offered', 'rejected',
  'withdrawn', 'archive',
]);

export const ApplicationTypeSchema = z.enum([
  'cold_strategic', 'recruiter_assisted', 'referral', 'other',
]);

export const ContactTypeSchema = z.enum([
  'company_contact', 'recruiter', 'other',
]);

export const OutreachStatusSchema = z.enum([
  'not_contacted', 'applied_msg_sent', 'double_down_sent',
  'follow_up_sent', 'replied', 'no_response',
]);

export const RecruiterStatusSchema = z.enum([
  'active', 'inactive', 'follow_up_needed',
]);

export const InterviewTypeSchema = z.enum([
  'phone_screen', 'technical', 'on_site', 'final_round', 'screening',
]);

export const InterviewStatusSchema = z.enum([
  'scheduled', 'completed', 'cancelled',
]);

export const InterviewOutcomeSchema = z.enum([
  'passed', 'rejected', 'withdrawn', 'no_decision_yet',
]);

export const TaskCategorySchema = z.enum([
  'application', 'outreach', 'research', 'interview_prep', 'recruiter', 'other',
]);

export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const TaskStatusSchema = z.enum(['open', 'complete', 'skipped']);

export const ContactInteractionTypeSchema = z.enum([
  'application_message', 'double_down', 'follow_up', 'reply_received',
  'phone_screen_confirmed', 'initial_contact', 'role_discussion',
  'resume_submitted', 'role_update', 'feedback_received', 'note',
]);

export const ContactTemplateTypeSchema = z.enum([
  'email_format', 'resume_version', 'intro_pitch', 'cover_letter', 'other',
]);

export const PreferredContactMethodSchema = z.enum([
  'email', 'linkedin', 'phone', 'text',
]);

export const HowFoundSchema = z.enum([
  'linkedin', 'company_site', 'referral', 'other',
]);

export const NotificationTypeSchema = z.enum([
  'overdue_task', 'upcoming_interview', 'follow_up_due', 'recruiter_no_response',
]);

export const ApplicationEventTypeSchema = z.enum([
  'status_change', 'company_reached_out', 'info_requested',
  'document_submitted', 'offer_received', 'interview_scheduled',
  'rejection', 'note',
]);

// ============================================================
// V2 Entity Schemas
// ============================================================

export const CreateApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required').max(MAX_COMPANY_LENGTH),
  title: z.string().min(1, 'Title is required').max(MAX_TITLE_LENGTH),
  industry: z.string().max(MAX_INDUSTRY_LENGTH).nullable().optional(),
  location: z.string().max(MAX_LOCATION_LENGTH).nullable().optional(),
  job_link: urlOrEmpty,
  app_link: urlOrEmpty,
  status: ApplicationStatusSchema.default('not_started'),
  application_type: z.preprocess(
    v => (v === '' ? null : v),
    ApplicationTypeSchema.nullable().optional(),
  ),
  checklist_state: z.record(z.unknown()).default({}),
  cover_letter: z.string().max(MAX_COVER_LETTER_LENGTH).nullable().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  pay: z.string().max(MAX_PAY_LENGTH).nullable().optional(),
  added: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .default(() => new Date().toISOString().split('T')[0]),
  applied_date: dateOrEmpty,
  deadline: dateOrEmpty,
});

export const UpdateApplicationSchema = CreateApplicationSchema.partial();

export const CreateContactSchema = z.object({
  application_id: z.string().uuid().nullable().optional(),
  first_name: z.string().min(1, 'First name is required').max(MAX_FIRST_NAME_LENGTH),
  last_name: z.string().min(1, 'Last name is required').max(MAX_LAST_NAME_LENGTH),
  contact_type: ContactTypeSchema,
  title: z.string().max(MAX_TITLE_LENGTH).nullable().optional(),
  email: z.string().email().max(MAX_EMAIL_LENGTH).nullable().optional(),
  phone: z.string().max(MAX_PHONE_LENGTH).nullable().optional(),
  linkedin_url: urlOrEmpty,
  agency: z.string().max(MAX_AGENCY_LENGTH).nullable().optional(),
  preferred_contact_method: z.preprocess(
    v => (v === '' ? null : v),
    PreferredContactMethodSchema.nullable().optional(),
  ),
  how_found: z.preprocess(
    v => (v === '' ? null : v),
    HowFoundSchema.nullable().optional(),
  ),
  outreach_status: z.preprocess(
    v => (v === '' ? null : v),
    OutreachStatusSchema.nullable().optional(),
  ),
  recruiter_status: z.preprocess(
    v => (v === '' ? null : v),
    RecruiterStatusSchema.nullable().optional(),
  ),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial();

export const CreateContactInteractionSchema = z.object({
  contact_id: z.string().uuid(),
  purpose: ContactInteractionTypeSchema,
  body: z.string().max(MAX_INTERACTION_BODY_LENGTH).nullable().optional(),
  occurred_at: z.string().datetime().optional(),
});

export const CreateContactTemplateSchema = z.object({
  contact_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(MAX_TEMPLATE_NAME_LENGTH),
  template_type: z.preprocess(
    v => (v === '' ? null : v),
    ContactTemplateTypeSchema.nullable().optional(),
  ),
  body: z.string().max(MAX_TEMPLATE_BODY_LENGTH).nullable().optional(),
});

export const UpdateContactTemplateSchema = CreateContactTemplateSchema.partial();

export const CreateApplicationContactSchema = z.object({
  application_id: z.string().uuid(),
  contact_id: z.string().uuid(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(MAX_TASK_TITLE_LENGTH),
  category: TaskCategorySchema,
  priority: TaskPrioritySchema.default('medium'),
  status: TaskStatusSchema.default('open'),
  due_date: dateOrEmpty,
  application_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(MAX_TASK_NOTES_LENGTH).nullable().optional(),
  is_auto_generated: z.boolean().default(false),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const CreateInterviewSchema = z.object({
  application_id: z.string().uuid(),
  interview_type: InterviewTypeSchema,
  scheduled_at: z.string().datetime(),
  interviewer_names: z.string().max(MAX_INTERVIEWER_NAMES_LENGTH).nullable().optional(),
  location_link: z.string().max(MAX_URL_LENGTH).nullable().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  status: InterviewStatusSchema.default('scheduled'),
  outcome: z.preprocess(
    v => (v === '' ? null : v),
    InterviewOutcomeSchema.nullable().optional(),
  ),
});

export const UpdateInterviewSchema = CreateInterviewSchema.partial();

export const UpdateNotificationPreferencesSchema = z.object({
  enabled: z.boolean(),
  notify_overdue_tasks: z.boolean(),
  notify_upcoming_interviews: z.boolean(),
  notify_follow_up_due: z.boolean(),
  notify_recruiter_no_response: z.boolean(),
});

export const CreateCompanyWatchlistEntrySchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(MAX_COMPANY_LENGTH),
  industry: z.string().max(MAX_INDUSTRY_LENGTH).nullable().optional(),
  website: urlOrEmpty,
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  priority: z.preprocess(
    v => (v === '' ? null : v),
    TaskPrioritySchema.nullable().optional(),
  ),
  target_apply_year: z
    .number()
    .int()
    .min(TARGET_APPLY_YEAR_MIN)
    .max(TARGET_APPLY_YEAR_MAX)
    .nullable()
    .optional(),
  added: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .default(() => new Date().toISOString().split('T')[0]),
});

export const UpdateCompanyWatchlistEntrySchema = CreateCompanyWatchlistEntrySchema.partial();

export const CreateApplicationEventSchema = z.object({
  event_type: ApplicationEventTypeSchema,
  body: z.string().max(MAX_INTERACTION_BODY_LENGTH).nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  occurred_at: z.string().datetime().optional(),
});

// ============================================================
// V2 Inferred Types
// ============================================================

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;
export type ContactType = z.infer<typeof ContactTypeSchema>;
export type OutreachStatus = z.infer<typeof OutreachStatusSchema>;
export type RecruiterStatus = z.infer<typeof RecruiterStatusSchema>;
export type InterviewType = z.infer<typeof InterviewTypeSchema>;
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;
export type InterviewOutcome = z.infer<typeof InterviewOutcomeSchema>;
export type TaskCategory = z.infer<typeof TaskCategorySchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type ContactInteractionType = z.infer<typeof ContactInteractionTypeSchema>;
export type ContactTemplateType = z.infer<typeof ContactTemplateTypeSchema>;
export type PreferredContactMethod = z.infer<typeof PreferredContactMethodSchema>;
export type HowFound = z.infer<typeof HowFoundSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type ApplicationEventType = z.infer<typeof ApplicationEventTypeSchema>;

export type CreateApplicationSchemaType = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationSchemaType = z.infer<typeof UpdateApplicationSchema>;
export type CreateContactSchemaType = z.infer<typeof CreateContactSchema>;
export type UpdateContactSchemaType = z.infer<typeof UpdateContactSchema>;
export type CreateContactInteractionSchemaType = z.infer<typeof CreateContactInteractionSchema>;
export type CreateContactTemplateSchemaType = z.infer<typeof CreateContactTemplateSchema>;
export type UpdateContactTemplateSchemaType = z.infer<typeof UpdateContactTemplateSchema>;
export type CreateApplicationContactSchemaType = z.infer<typeof CreateApplicationContactSchema>;
export type CreateTaskSchemaType = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskSchemaType = z.infer<typeof UpdateTaskSchema>;
export type CreateInterviewSchemaType = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewSchemaType = z.infer<typeof UpdateInterviewSchema>;
export type UpdateNotificationPreferencesSchemaType = z.infer<typeof UpdateNotificationPreferencesSchema>;
export type CreateCompanyWatchlistEntrySchemaType = z.infer<typeof CreateCompanyWatchlistEntrySchema>;
export type UpdateCompanyWatchlistEntrySchemaType = z.infer<typeof UpdateCompanyWatchlistEntrySchema>;
export type CreateApplicationEventSchemaType = z.infer<typeof CreateApplicationEventSchema>;
