import type { Job, MinYear } from '@shared/types';
import { MIN_YEAR_RANK } from '@shared/types';
import { isDeadlineSoon, isStaleJob } from './dateUtils';

export type JobUrgency = 'urgent' | 'stale' | 'normal';

/** Returns false if the student's class is below the job's minimum year requirement. */
export function meetsMinYear(job: Job, currentClass: MinYear | null | undefined): boolean {
  if (!job.min_year || !currentClass) return true;
  return MIN_YEAR_RANK[currentClass] >= MIN_YEAR_RANK[job.min_year];
}

/**
 * Like isStaleJob, but suppresses the stale flag when the student doesn't
 * meet the job's minimum year requirement.
 */
export function isJobStaleForStudent(job: Job, currentClass: MinYear | null | undefined): boolean {
  if (!meetsMinYear(job, currentClass)) return false;
  return isStaleJob(job.added, job.status);
}

/**
 * Returns a semantic urgency level for a job based on its status and dates.
 * Pass currentClass so that under-qualified jobs are never marked stale.
 * Components use this to derive their own visual styles.
 */
export function getJobUrgency(job: Job, currentClass?: MinYear | null): JobUrgency {
  if (['applied', 'archive'].includes(job.status)) return 'normal';
  if (isDeadlineSoon(job.deadline)) return 'urgent';
  if (isJobStaleForStudent(job, currentClass)) return 'stale';
  return 'normal';
}

export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
