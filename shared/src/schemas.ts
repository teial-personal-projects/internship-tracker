import { z } from 'zod';
import {
  MAX_COMPANY_LENGTH, MAX_TITLE_LENGTH, MAX_INDUSTRY_LENGTH,
  MAX_LOCATION_LENGTH, MAX_CONFERENCE_LENGTH, MAX_PAY_LENGTH,
  MAX_NOTES_LENGTH, MAX_URL_LENGTH, MAX_MAJOR_LENGTH,
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
