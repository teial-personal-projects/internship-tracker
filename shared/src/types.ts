// ============================================================
// Enums
// ============================================================

export type MinYear =
  | 'freshman'
  | 'sophomore'
  | 'junior'
  | 'senior'
  | 'graduate'
  | 'other';

export type JobStatus =
  | 'not_started'
  | 'in_progress'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'underqualified'
  | 'missed_deadline'
  | 'applied'
  | 'archive'
  | 'other';

export const STATUS_CYCLE: JobStatus[] = [
  'not_started',
  'in_progress',
  'interviewing',
  'applied',
  'offered',
  'rejected',
  'underqualified',
  'missed_deadline',
  'archive',
  'other',
];

export const MIN_YEAR_OPTIONS: MinYear[] = [
  'freshman',
  'sophomore',
  'junior',
  'senior',
  'graduate',
  'other',
];

export const MIN_YEAR_RANK: Record<MinYear, number> = {
  freshman: 1,
  sophomore: 2,
  junior: 3,
  senior: 4,
  graduate: 5,
  other: 6,
};

// ============================================================
// Core Entities
// ============================================================

export interface Job {
  id: string;
  user_id: string;
  company: string;
  title: string;
  industry?: string | null;
  location?: string | null;
  min_year?: MinYear | null;
  job_link?: string | null;
  app_link?: string | null;
  status: JobStatus;
  conference?: string | null;
  cover_letter?: string | null;
  pay?: string | null;
  notes?: string | null;
  added: string; // ISO date string YYYY-MM-DD
  applied_date?: string | null; // ISO date string YYYY-MM-DD
  deadline?: string | null; // ISO date string YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export type CreateJobInput = Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateJobInput = Partial<CreateJobInput>;

export interface UserProfile {
  user_id: string;
  major?: string | null;
  positions: string[];
  locations: string[];
}

export type UpdateProfileInput = Omit<UserProfile, 'user_id'>;

// ============================================================
// API Response Shapes
// ============================================================

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  issues?: Record<string, string[]>;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Filter / Query Types
// ============================================================

export type FilterTab = 'active' | 'applied_archived';

export type QuickFilter =
  | 'all'
  | 'active'
  | 'not_started'
  | 'applied'
  | 'conference'
  | 'due_soon'
  | 'stale'
  | 'archived';

export interface JobFilters {
  tab: FilterTab;
  quickFilter: QuickFilter;
  minYearFilter?: MinYear;
}

// ============================================================
// Stats
// ============================================================

export interface JobStats {
  total: number;
  saved: number;
  applied: number;
  interviewing: number;
  confVisits: number;
}
