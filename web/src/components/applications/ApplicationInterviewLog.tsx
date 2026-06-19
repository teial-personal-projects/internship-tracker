import type { Interview } from '@shared/schemas';
import { Spinner } from '@/components/Spinner';
import { formatDate } from '@/lib/dateUtils';
import { INTERVIEW_TYPE_LABELS } from '@/theme';

const INTERVIEW_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const INTERVIEW_OUTCOME_LABELS: Record<string, string> = {
  passed: 'Passed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  no_decision_yet: 'No decision yet',
};

interface Props {
  interviews: Interview[];
  isLoading: boolean;
  isError: boolean;
}

export function ApplicationInterviewLog({ interviews, isLoading, isError }: Props) {
  return (
    <section className="rounded-lg border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Interview History
        </h3>
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-3)' }}>
          {interviews.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-sm" style={{ color: 'var(--ink-3)' }}>
          <Spinner size="sm" /> Loading interviews
        </div>
      ) : isError ? (
        <p className="text-sm" style={{ color: 'var(--rose)' }}>
          Failed to load interviews.
        </p>
      ) : interviews.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
          No interviews logged for this application.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {interviews.map((interview) => (
            <InterviewLogItem key={interview.id} interview={interview} />
          ))}
        </ol>
      )}
    </section>
  );
}

function InterviewLogItem({ interview }: { interview: Interview }) {
  const typeLabel = INTERVIEW_TYPE_LABELS[interview.interview_type] ?? interview.interview_type;
  const statusLabel = INTERVIEW_STATUS_LABELS[interview.status] ?? interview.status;
  const outcomeLabel = interview.outcome ? INTERVIEW_OUTCOME_LABELS[interview.outcome] ?? interview.outcome : null;

  return (
    <li className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--line-soft)', background: 'var(--softer)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {typeLabel}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-3)' }}>
            {formatInterviewDate(interview.scheduled_at)}
          </p>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
          {statusLabel}
        </span>
      </div>

      {(interview.interviewer_names || outcomeLabel || interview.notes) && (
        <div className="mt-2 flex flex-col gap-1 text-xs" style={{ color: 'var(--ink-3)' }}>
          {interview.interviewer_names && <p>With {interview.interviewer_names}</p>}
          {outcomeLabel && <p>Outcome: {outcomeLabel}</p>}
          {interview.notes && <p className="line-clamp-2">{interview.notes}</p>}
        </div>
      )}
    </li>
  );
}

function formatInterviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
