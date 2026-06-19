import { formatDistanceToNow } from 'date-fns';
import { ApplicationTypeBadge } from '@/components/ApplicationTypeBadge';
import { StatusBadge } from '@/components/StatusBadge';
import type { Application, ApplicationStatus } from '@shared/schemas';

interface NeedAttentionPanelProps {
  applications: Application[];
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
  'in_progress',
  'applied',
  'screening',
  'interviewing',
  'technical',
  'on_site',
  'final_round',
];

export function NeedAttentionPanel({ applications }: NeedAttentionPanelProps) {
  const activeApplications = applications.filter((application) =>
    ACTIVE_STATUSES.includes(application.status),
  );

  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Needs attention
        </h3>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {activeApplications.length}
        </span>
      </div>

      {activeApplications.length === 0 ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          Nothing in active stages right now.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {activeApplications.map((application) => (
            <article key={application.id} className="px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    {application.company}
                  </h4>
                  <p className="mt-0.5 truncate text-sm" style={{ color: 'var(--ink-3)' }}>
                    {application.title}
                  </p>
                </div>
                <span className="shrink-0 text-xs" style={{ color: 'var(--ink-3)' }}>
                  Updated {formatDistanceToNow(new Date(application.updated_at), { addSuffix: true })}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={application.status} />
                <ApplicationTypeBadge type={application.application_type} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
