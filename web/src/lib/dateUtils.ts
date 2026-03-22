import { addDays, subDays, isWithinInterval, parseISO } from 'date-fns';

/** Returns today's date as a YYYY-MM-DD string. */
export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Formats a YYYY-MM-DD string to MM/DD/YY for display. */
export function formatDate(d: string | null | undefined, empty = '—'): string {
  if (!d) return empty;
  const [year, month, day] = d.split('-');
  return `${month}/${day}/${year?.slice(2)}`;
}

/** Returns true if the deadline falls within the next 3 days (inclusive of today). */
export function isDeadlineSoon(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const today = new Date();
  return isWithinInterval(parseISO(deadline), { start: today, end: addDays(today, 3) });
}

/** Returns true if the job was added 7+ days ago and is still not applied. */
export function isStaleJob(added: string, status: string): boolean {
  return ['not_started', 'in_progress'].includes(status) &&
    parseISO(added) <= subDays(new Date(), 7);
}
