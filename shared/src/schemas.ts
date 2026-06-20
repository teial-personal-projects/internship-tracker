import { z } from 'zod';
import {
  MAX_COMPANY_LENGTH, MAX_TITLE_LENGTH, MAX_INDUSTRY_LENGTH,
  MAX_LOCATION_LENGTH, MAX_CONFERENCE_LENGTH, MAX_PAY_LENGTH,
  MAX_NOTES_LENGTH, MAX_URL_LENGTH, MAX_MAJOR_LENGTH,
  MAX_COVER_LETTER_LENGTH, MAX_FIRST_NAME_LENGTH, MAX_LAST_NAME_LENGTH,
  MAX_EMAIL_LENGTH, MAX_PHONE_LENGTH, MAX_AGENCY_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH, MAX_TEMPLATE_BODY_LENGTH,
  MAX_INTERACTION_BODY_LENGTH, MAX_TASK_TITLE_LENGTH, MAX_TASK_NOTES_LENGTH,
  MAX_INTERVIEWER_NAMES_LENGTH,
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
    .default(() => {
      const d = new Date();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    }),
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
  'not_started', 'in_progress', 'applied', 'interviewing', 'offered', 'rejected', 'archive',
]);

export const ApplicationTypeSchema = z.enum([
  'cold_strategic', 'recruiter_assisted', 'referral', 'other',
]);

export const ApplicationSourceSchema = z.enum([
  'manual', 'imported', 'watchlist', 'radar',
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
  'phone_screen',
  'technical',
  'on_site',
  'final_round',
  'screening',
  'coding',
  'system_design',
  'behavioral',
  'recruiter_screen',
  'hiring_manager',
  'final',
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

export const AtsTypeSchema = z.enum([
  'greenhouse', 'lever', 'ashby', 'smartrecruiters', 'pinpoint',
  'welcomekit', 'custom',
]);

export const PostingStatusSchema = z.enum([
  'new', 'seen', 'dismissed', 'promoted',
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
    v => (v === '' || v == null ? 'cold_strategic' : v),
    ApplicationTypeSchema.default('cold_strategic'),
  ),
  checklist_state: z.record(z.unknown()).default({}),
  source: ApplicationSourceSchema.default('manual'),
  source_metadata: z.record(z.unknown()).default({}),
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
  company: z.string().max(MAX_COMPANY_LENGTH).nullable().optional(),
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
  target_apply_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  added: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .default(() => new Date().toISOString().split('T')[0]),
  ats_type: AtsTypeSchema.nullable().optional(),
  ats_board_token: z.string().nullable().optional(),
  radar_enabled: z.boolean().optional(),
});

export const UpdateCompanyWatchlistEntrySchema = CreateCompanyWatchlistEntrySchema
  .partial()
  .extend({
    ats_type: AtsTypeSchema.nullable().optional(),
    ats_board_token: z.string().nullable().optional(),
    radar_enabled: z.boolean().optional(),
  });

export const CreateApplicationEventSchema = z.object({
  event_type: ApplicationEventTypeSchema,
  body: z.string().max(MAX_INTERACTION_BODY_LENGTH).nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  occurred_at: z.string().datetime().optional(),
});

export const RadarSourceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_name: z.string().min(1).max(MAX_COMPANY_LENGTH),
  ats_type: AtsTypeSchema.nullable(),
  ats_board_token: z.string().nullable(),
  radar_enabled: z.boolean(),
  last_refreshed_at: z.string().datetime().nullable(),
});

export const DiscoveredPostingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  watchlist_id: z.string().uuid(),
  company_name: z.string().min(1).max(MAX_COMPANY_LENGTH),
  external_job_id: z.string().min(1),
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  location: z.string().max(MAX_LOCATION_LENGTH).nullable(),
  remote_status: z.string().max(100).nullable(),
  url: z.string().max(MAX_URL_LENGTH).refine(
    (value) => /^https?:\/\/.+/.test(value),
    { message: 'Must be a valid URL' },
  ),
  posted_at: z.string().datetime().nullable(),
  first_seen_at: z.string().datetime(),
  status: PostingStatusSchema,
  raw_payload: z.record(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const RadarCriteriaSchema = z.object({
  user_id: z.string().uuid(),
  include_keywords: z.array(z.string().max(100)),
  exclude_keywords: z.array(z.string().max(100)),
  seniority_terms: z.array(z.string().max(100)),
  location_rules: z.array(z.enum(['remote_us', 'la', 'onsite', 'unknown'])),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const UpdateRadarCriteriaSchema = RadarCriteriaSchema
  .omit({ user_id: true, created_at: true, updated_at: true })
  .partial();

// ============================================================
// V2 Read Schemas
// ============================================================

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company: z.string().min(1).max(MAX_COMPANY_LENGTH),
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  industry: z.string().max(MAX_INDUSTRY_LENGTH).nullable(),
  location: z.string().max(MAX_LOCATION_LENGTH).nullable(),
  job_link: z.string().max(MAX_URL_LENGTH).nullable(),
  app_link: z.string().max(MAX_URL_LENGTH).nullable(),
  status: ApplicationStatusSchema,
  application_type: ApplicationTypeSchema,
  checklist_state: z.record(z.unknown()),
  source: ApplicationSourceSchema,
  source_metadata: z.record(z.unknown()),
  cover_letter: z.string().max(MAX_COVER_LETTER_LENGTH).nullable(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable(),
  pay: z.string().max(MAX_PAY_LENGTH).nullable(),
  added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  applied_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ContactSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  contact_type: ContactTypeSchema,
  application_id: z.string().uuid().nullable(),
  company: z.string().max(MAX_COMPANY_LENGTH).nullable(),
  first_name: z.string().min(1).max(MAX_FIRST_NAME_LENGTH),
  last_name: z.string().min(1).max(MAX_LAST_NAME_LENGTH),
  title: z.string().max(MAX_TITLE_LENGTH).nullable(),
  email: z.string().max(MAX_EMAIL_LENGTH).nullable(),
  phone: z.string().max(MAX_PHONE_LENGTH).nullable(),
  linkedin_url: z.string().max(MAX_URL_LENGTH).nullable(),
  agency: z.string().max(MAX_AGENCY_LENGTH).nullable(),
  preferred_contact_method: PreferredContactMethodSchema.nullable(),
  how_found: HowFoundSchema.nullable(),
  outreach_status: OutreachStatusSchema.nullable(),
  recruiter_status: RecruiterStatusSchema.nullable(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable(),
  date_of_last_outreach: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(MAX_TASK_TITLE_LENGTH),
  category: TaskCategorySchema,
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  application_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  notes: z.string().max(MAX_TASK_NOTES_LENGTH).nullable(),
  is_auto_generated: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const InterviewSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  application_id: z.string().uuid(),
  interview_type: InterviewTypeSchema,
  scheduled_at: z.string().datetime(),
  interviewer_names: z.string().max(MAX_INTERVIEWER_NAMES_LENGTH).nullable(),
  location_link: z.string().max(MAX_URL_LENGTH).nullable(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable(),
  status: InterviewStatusSchema,
  outcome: InterviewOutcomeSchema.nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ApplicationEventSchema = z.object({
  id: z.string().uuid(),
  application_id: z.string().uuid(),
  user_id: z.string().uuid(),
  event_type: ApplicationEventTypeSchema,
  body: z.string().max(MAX_INTERACTION_BODY_LENGTH).nullable(),
  contact_id: z.string().uuid().nullable(),
  occurred_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const TodayStatsSchema = z.object({
  applications: z.number().int().nonnegative(),
  open_tasks: z.number().int().nonnegative(),
  interviews_this_week: z.number().int().nonnegative(),
});

export const TodayFunnelBucketSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  percent: z.number().min(0).max(100),
});

export const TodayInterviewSchema = InterviewSchema.extend({
  application_company: z.string().max(MAX_COMPANY_LENGTH),
  application_title: z.string().max(MAX_TITLE_LENGTH),
  application_type: ApplicationTypeSchema,
});

export const TodayTaskSchema = TaskSchema.extend({
  application_company: z.string().max(MAX_COMPANY_LENGTH).nullable(),
  application_title: z.string().max(MAX_TITLE_LENGTH).nullable(),
  application_type: ApplicationTypeSchema.nullable(),
  contact_name: z.string().max(MAX_FIRST_NAME_LENGTH + MAX_LAST_NAME_LENGTH + 1).nullable(),
});

export const ApplicationActivityItemSchema = ApplicationEventSchema.extend({
  company: z.string().max(MAX_COMPANY_LENGTH),
  title: z.string().max(MAX_TITLE_LENGTH),
});

export const TodayPayloadSchema = z.object({
  stats: TodayStatsSchema,
  up_next: z.array(TodayInterviewSchema),
  action_items: z.array(TodayTaskSchema),
  need_attention: z.array(ApplicationSchema),
  funnel: z.array(TodayFunnelBucketSchema),
  overdue_follow_ups: z.array(ContactSchema),
  recent_contacts: z.array(ContactSchema),
});

// ============================================================
// V2 Inferred Types
// ============================================================

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;
export type ApplicationSource = z.infer<typeof ApplicationSourceSchema>;
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
export type AtsType = z.infer<typeof AtsTypeSchema>;
export type PostingStatus = z.infer<typeof PostingStatusSchema>;

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
export type RadarSource = z.infer<typeof RadarSourceSchema>;
export type DiscoveredPosting = z.infer<typeof DiscoveredPostingSchema>;
export type RadarCriteria = z.infer<typeof RadarCriteriaSchema>;
export type UpdateRadarCriteriaSchemaType = z.infer<typeof UpdateRadarCriteriaSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Interview = z.infer<typeof InterviewSchema>;
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>;
export type TodayStats = z.infer<typeof TodayStatsSchema>;
export type TodayFunnelBucket = z.infer<typeof TodayFunnelBucketSchema>;
export type TodayInterview = z.infer<typeof TodayInterviewSchema>;
export type TodayTask = z.infer<typeof TodayTaskSchema>;
export type ApplicationActivityItem = z.infer<typeof ApplicationActivityItemSchema>;
export type TodayPayload = z.infer<typeof TodayPayloadSchema>;

// ============================================================
// V2 DB Entity Types
// ============================================================

export type CreateApplicationInput = Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateApplicationInput = Partial<CreateApplicationInput>;
