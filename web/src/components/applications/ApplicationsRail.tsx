import { formatDistanceToNow } from 'date-fns';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';
import { useApplicationActivity } from '@/hooks/useApplications';
import { EVENT_LABELS } from '@/lib/applicationEvents';

interface ApplicationsRailProps {
  statusCounts: Record<string, number>;
  activeStatus: string;
  onStatusClick: (status: string) => void;
}

export const PIPELINE_STAGES = [
  'not_started',
  'in_progress',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'archive',
] as const;

export function getPipelineStageRows(statusCounts: Record<string, number>) {
  return PIPELINE_STAGES.map((status) => ({
    status,
    count: statusCounts[status] ?? 0,
  }));
}

function PipelineCard({ statusCounts, activeStatus, onStatusClick }: ApplicationsRailProps) {
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Pipeline
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-3)' }}>
          {total} total
        </p>
      </div>
      <div className="p-2">
        {getPipelineStageRows(statusCounts).map(({ status, count }) => {
          const colors = STATUS_COLORS[status] ?? { dot: 'var(--ink-4)' };
          const isEmpty = count === 0;
          const isActive = activeStatus === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusClick(status)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--softer)]"
              style={{ background: isActive ? 'var(--soft)' : 'transparent' }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: colors.dot, opacity: isEmpty ? 0.35 : 1 }}
                />
                <span className="truncate text-sm" style={{ color: isEmpty ? 'var(--ink-4)' : 'var(--ink-2)' }}>
                  {STATUS_LABELS[status] ?? status}
                </span>
              </span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: isEmpty ? 'var(--ink-4)' : 'var(--ink)' }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActivityCard() {
  const { data: activity = [], isLoading, error } = useApplicationActivity();

  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Recent activity
        </h3>
      </div>

      {isLoading ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          Loading activity...
        </p>
      ) : error ? (
        <p className="p-4 text-sm" style={{ color: '#B91C1C' }}>
          Could not load activity.
        </p>
      ) : activity.length === 0 ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          No recent activity.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {activity.map((item) => (
            <article key={item.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    {item.company}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                    {EVENT_LABELS[item.event_type]}
                  </p>
                </div>
                <span className="shrink-0 text-xs" style={{ color: 'var(--ink-3)' }}>
                  {formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}
                </span>
              </div>
              {item.body && (
                <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: 'var(--ink-3)' }}>
                  {item.body}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ApplicationsRail(props: ApplicationsRailProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <PipelineCard {...props} />
      <ActivityCard />
    </aside>
  );
}
