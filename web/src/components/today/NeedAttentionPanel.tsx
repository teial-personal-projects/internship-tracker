import { ApplicationCompactCard } from '@/components/applications/ApplicationCompactCard';
import type { Application, ApplicationStatus } from '@shared/schemas';

interface NeedAttentionPanelProps {
  applications: Application[];
  onEdit: (app: Application) => void;
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
  'in_progress',
  'applied',
  'interviewing',
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
            <ApplicationCompactCard
              key={application.id}
              app={application}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
