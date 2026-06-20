import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/dateUtils';
import type { Application, ApplicationStatus } from '@shared/schemas';

interface NeedAttentionPanelProps {
  applications: Application[];
  onEdit: (app: Application) => void;
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

export function NeedAttentionPanel({ applications, onEdit }: NeedAttentionPanelProps) {
  const activeApplications = applications.filter((application) =>
    ACTIVE_STATUSES.includes(application.status),
  );

  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Applications
        </h3>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {activeApplications.length}
        </span>
      </div>

      {activeApplications.length === 0 ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          No active applications right now.
        </p>
      ) : (
        <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeApplications.map((application) => (
            <article
              key={application.id}
              className="min-w-0 rounded-md border bg-white p-3 shadow-sm"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {application.company}
                </h4>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5" style={{ color: 'var(--ink-3)' }}>
                  {application.title}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={application.status} />
                <button
                  type="button"
                  onClick={() => onEdit(application)}
                  className="btn-outline px-2 py-1 text-xs"
                >
                  Edit
                </button>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-4)' }}>
                    Applied
                  </dt>
                  <dd className="mt-0.5 truncate" style={{ color: application.applied_date ? 'var(--ink-2)' : 'var(--ink-4)' }}>
                    {formatDate(application.applied_date, 'Not applied')}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-4)' }}>
                    Updated
                  </dt>
                  <dd className="mt-0.5 truncate" style={{ color: 'var(--ink-2)' }}>
                    {formatDistanceToNow(new Date(application.updated_at), { addSuffix: true })}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
