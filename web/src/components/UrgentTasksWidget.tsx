import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useApplications } from '@/hooks/useApplications';
import { useTasks } from '@/hooks/useTasks';
import { formatDate } from '@/lib/dateUtils';

export function UrgentTasksWidget() {
  const { data: tasks = [], isLoading, error } = useTasks({ status: 'open', priority: 'high' });
  const { data: applicationsData } = useApplications({ limit: 100 });
  const applications = applicationsData?.data ?? [];
  const applicationById = new Map(applications.map((application) => [application.id, application]));
  const urgentTasks = tasks.slice(0, 3);

  return (
    <div className="rounded-lg border px-4 py-3 bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--ink-3)' }}>
            Urgent Tasks
          </span>
        </div>
        <Link
          to="/action-items"
          className="text-xs font-medium hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Loading tasks...</p>
      ) : error ? (
        <p className="text-sm" style={{ color: '#B91C1C' }}>Could not load urgent tasks.</p>
      ) : urgentTasks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No open high-priority tasks.</p>
      ) : (
        <div className="grid gap-2">
          {urgentTasks.map((task) => {
            const application = task.application_id ? applicationById.get(task.application_id) : undefined;
            return (
              <Link
                key={task.id}
                to="/action-items"
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded border px-3 py-2 hover:bg-[var(--soft)]"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{task.title}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--ink-3)' }}>
                    {application?.company ?? 'Unlinked'}
                  </p>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                  {formatDate(task.due_date)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
