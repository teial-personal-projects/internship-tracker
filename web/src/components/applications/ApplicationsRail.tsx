import { formatDistanceToNow } from 'date-fns';
import { CircleAlert } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';
import { useApplicationActivity } from '@/hooks/useApplications';
import { EVENT_LABELS } from '@/lib/applicationEvents';

interface ApplicationsRailProps {
  statusCounts: Record<string, number>;
  activeStatus: string;
  unsetTypeCount: number;
  onStatusClick: (status: string) => void;
}

const PIPELINE_STAGES = [
  'not_started',
  'in_progress',
  'applied',
  'screening',
  'interviewing',
  'technical',
  'on_site',
  'final_round',
  'offered',
  'rejected',
  'withdrawn',
  'archive',
] as const;

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
        {PIPELINE_STAGES.map((status) => {
          const count = statusCounts[status] ?? 0;
          if (count === 0 && status !== activeStatus) return null;

          const colors = STATUS_COLORS[status] ?? { dot: 'var(--ink-4)' };

          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusClick(status)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--softer)]"
              style={{ background: activeStatus === status ? 'var(--soft)' : 'transparent' }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors.dot }} />
                <span className="truncate text-sm" style={{ color: 'var(--ink-2)' }}>
                  {STATUS_LABELS[status] ?? status}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
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

function UnsetTypeNudge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border p-3 text-sm" style={{ background: 'var(--sun-soft)', color: '#92400E', borderColor: '#FDE68A' }}>
      <CircleAlert size={15} className="mt-0.5 shrink-0" />
      <span>
        {count} application{count > 1 ? 's' : ''} {count > 1 ? 'have' : 'has'} no type set.
      </span>
    </div>
  );
}

export function ApplicationsRail(props: ApplicationsRailProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <PipelineCard {...props} />
      <ActivityCard />
      <UnsetTypeNudge count={props.unsetTypeCount} />
    </aside>
  );
}
