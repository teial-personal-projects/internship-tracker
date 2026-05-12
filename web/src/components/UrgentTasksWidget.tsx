import { Link } from 'react-router-dom';

export function UrgentTasksWidget() {
  return (
    <div className="rounded-lg border px-4 py-3 bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--ink-3)' }}>
          Urgent Tasks
        </span>
        <Link
          to="/action-items"
          className="text-xs font-medium hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          View all →
        </Link>
      </div>
      <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
        Task tracking is coming in the next update.
      </p>
    </div>
  );
}
