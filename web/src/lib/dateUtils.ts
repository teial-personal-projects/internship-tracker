import { addDays, subDays, isWithinInterval, parseISO } from 'date-fns';

export const DEADLINE_WINDOW = 5;  // days until deadline triggers a warning
export const MAX_STALE_DAYS  = 7;  // days without applying before a job is considered stale

/** Returns today's date as a YYYY-MM-DD string in local time. */
export function todayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a YYYY-MM-DD string to MM/DD/YYYY for display. */
export function formatDate(d: string | null | undefined, empty = '—'): string {
  if (!d) return empty;
  const [year, month, day] = d.split('-');
  return `${month}/${day}/${year}`;
}

/** Returns true if the deadline falls within the next DEADLINE_WINDOW days (inclusive of today). */
export function isDeadlineSoon(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const today = new Date();
  return isWithinInterval(parseISO(deadline), { start: today, end: addDays(today, DEADLINE_WINDOW) });
}

/** Returns true if the job was added MAX_STALE_DAYS+ days ago and is still not applied. */
export function isStaleJob(added: string, status: string): boolean {
  return ['not_started', 'in_progress'].includes(status) &&
    parseISO(added) <= subDays(new Date(), MAX_STALE_DAYS);
}

/** Returns true if the job was added within the last 7 days. */
export function isNewJob(added: string): boolean {
  return parseISO(added) >= subDays(new Date(), 7);
}
