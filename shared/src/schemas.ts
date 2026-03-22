import { z } from 'zod';

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

const urlOrEmpty = z
  .string()
  .max(2048)
  .refine((v) => v === '' || v === null || /^https?:\/\/.+/.test(v), {
    message: 'Must be a valid URL or empty',
  })
  .nullable()
  .optional();

export const CreateJobSchema = z.object({
  company: z.string().min(1, 'Company is required').max(200),
  title: z.string().min(1, 'Title is required').max(200),
  industry: z.string().max(100).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  min_year: MinYearSchema.nullable().optional(),
  job_link: urlOrEmpty,
  app_link: urlOrEmpty,
  status: JobStatusSchema.default('not_started'),
  conference: z.string().max(200).nullable().optional(),
  cover_letter: urlOrEmpty, // URL to a cover letter document
  pay: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  added: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .default(() => new Date().toISOString().split('T')[0]),
  applied_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial();

export const UpdateProfileSchema = z.object({
  major: z.string().max(200).nullable().optional(),
  positions: z.array(z.string().max(100)).max(20).default([]),
  locations: z.array(z.string().max(100)).max(20).default([]),
});

export type CreateJobSchemaType = z.infer<typeof CreateJobSchema>;
export type UpdateJobSchemaType = z.infer<typeof UpdateJobSchema>;
export type UpdateProfileSchemaType = z.infer<typeof UpdateProfileSchema>;
