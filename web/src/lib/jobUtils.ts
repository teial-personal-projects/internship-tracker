import type { Job } from '@shared/types';
import { isDeadlineSoon, isStaleJob } from './dateUtils';

export type JobUrgency = 'urgent' | 'stale' | 'normal';

export function getJobUrgency(job: Job): JobUrgency {
  if (['applied', 'archive'].includes(job.status)) return 'normal';
  if (isDeadlineSoon(job.deadline)) return 'urgent';
  if (isStaleJob(job.added, job.status)) return 'stale';
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
