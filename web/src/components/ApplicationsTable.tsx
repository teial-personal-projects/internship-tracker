import type { Application } from '@shared/schemas';
import { ApplicationRow } from './ApplicationRow';

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

const HEADERS = [
  { key: 'company',    label: 'Company / Role' },
  { key: 'location',   label: 'Location' },
  { key: 'applied',    label: 'Applied' },
  { key: 'status',     label: 'Status' },
  { key: 'type',       label: 'Type' },
  { key: 'checklist',  label: 'Checklist' },
  { key: 'actions',    label: '' },
];

export function ApplicationsTable({ applications, onEdit, onDelete, deletingId }: Props) {
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No applications found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr style={{ background: 'var(--soft)', borderBottom: '2px solid var(--line)' }}>
            {HEADERS.map(({ key, label }) => (
              <th
                key={key}
                className="text-left text-[11px] font-semibold uppercase tracking-wide px-2 py-3 whitespace-nowrap"
                style={{ color: 'var(--ink-3)' }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === app.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
