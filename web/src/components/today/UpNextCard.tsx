import { format } from 'date-fns';
import { Clock, ExternalLink, FileText, Users } from 'lucide-react';
import { INTERVIEW_TYPE_LABELS } from '@/theme';
import type { TodayInterview } from '@shared/schemas';

interface UpNextCardProps {
  interview: TodayInterview | null;
}

function InfoLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
      {children}
    </p>
  );
}

export function UpNextCard({ interview }: UpNextCardProps) {
  if (!interview) {
    return (
      <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
        No interviews scheduled.
      </p>
    );
  }

  const timeLabel = format(new Date(interview.scheduled_at), 'EEE, MMM d, h:mm a');
  const typeLabel = INTERVIEW_TYPE_LABELS[interview.interview_type] ?? interview.interview_type;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              <Clock size={15} strokeWidth={1.75} />
              {timeLabel}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}
            >
              {typeLabel}
            </span>
          </div>
          <h4 className="mt-2 truncate text-lg font-semibold" style={{ color: 'var(--ink)' }}>
            {interview.application_company}
          </h4>
          <p className="truncate text-sm" style={{ color: 'var(--ink-3)' }}>
            {interview.application_title}
          </p>
        </div>

        {interview.location_link && (
          <a
            href={interview.location_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            Join
            <ExternalLink size={14} strokeWidth={2} />
          </a>
        )}
      </div>

      {interview.interviewer_names && (
        <div className="flex gap-2">
          <Users size={16} className="mt-1 shrink-0" strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
          <InfoLine>{interview.interviewer_names}</InfoLine>
        </div>
      )}

      {interview.notes && (
        <div className="flex gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--line)', background: 'var(--softer)' }}>
          <FileText size={16} className="mt-1 shrink-0" strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Prep notes
            </p>
            <InfoLine>{interview.notes}</InfoLine>
          </div>
        </div>
      )}
    </div>
  );
}
