import { isToday } from 'date-fns';
import type { TodayPayload } from '@shared/schemas';

interface SummaryInput {
  up_next: Pick<TodayPayload['up_next'][number], 'scheduled_at'>[];
  stats: Pick<TodayPayload['stats'], 'open_tasks'>;
  overdue_follow_ups: unknown[];
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function joinClauses(clauses: string[]): string {
  if (clauses.length === 1) return clauses[0];
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`;
}

export function getInterviewsTodayCount(payload: SummaryInput): number {
  return payload.up_next.filter((interview) => isToday(new Date(interview.scheduled_at))).length;
}

export function buildTodaySummary(payload: SummaryInput): string {
  const interviewsToday = getInterviewsTodayCount(payload);
  const clauses = [
    interviewsToday > 0 ? pluralize(interviewsToday, 'interview') + ' today' : null,
    payload.stats.open_tasks > 0 ? pluralize(payload.stats.open_tasks, 'action item') : null,
    payload.overdue_follow_ups.length > 0
      ? pluralize(payload.overdue_follow_ups.length, 'overdue follow-up')
      : null,
  ].filter((clause): clause is string => clause !== null);

  if (clauses.length === 0) {
    return "You're all caught up. Nothing needs you today.";
  }

  return `You have ${joinClauses(clauses)}.`;
}
