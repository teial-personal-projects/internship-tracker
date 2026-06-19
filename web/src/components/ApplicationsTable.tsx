import type { Application } from '@shared/schemas';
import { ApplicationRow } from './ApplicationRow';

interface Props {
  applications: Application[];
  sort: ApplicationSort;
  onSort: (sort: ApplicationSort) => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

type ApplicationSort =
  | 'added_desc'
  | 'added_asc'
  | 'applied_desc'
  | 'applied_asc'
  | 'company_asc'
  | 'company_desc'
  | 'status_asc'
  | 'status_desc'
  | 'location_asc'
  | 'location_desc';
type SortColumn = 'company' | 'status' | 'applied' | 'added' | 'location';

const HEADERS = [
  { key: 'application', label: 'Application', sortColumn: 'company' },
  { key: 'status',      label: 'Status',      sortColumn: 'status' },
  { key: 'applied',     label: 'Applied',     sortColumn: 'applied' },
  { key: 'added',       label: 'Added',       sortColumn: 'added' },
  { key: 'location',    label: 'Location',    sortColumn: 'location' },
  { key: 'actions',     label: '' },
] satisfies Array<{ key: string; label: string; sortColumn?: SortColumn }>;

function sortForColumn(column: SortColumn, currentSort: ApplicationSort): ApplicationSort {
  if (column === 'company') return currentSort === 'company_asc' ? 'company_desc' : 'company_asc';
  if (column === 'status') return currentSort === 'status_asc' ? 'status_desc' : 'status_asc';
  if (column === 'applied') return currentSort === 'applied_desc' ? 'applied_asc' : 'applied_desc';
  if (column === 'location') return currentSort === 'location_asc' ? 'location_desc' : 'location_asc';
  return currentSort === 'added_desc' ? 'added_asc' : 'added_desc';
}

function sortIndicator(column: SortColumn, currentSort: ApplicationSort): string {
  if (column === 'company') {
    if (currentSort === 'company_asc') return 'A-Z';
    if (currentSort === 'company_desc') return 'Z-A';
  }

  if (column === 'applied') {
    if (currentSort === 'applied_desc') return 'Newest';
    if (currentSort === 'applied_asc') return 'Oldest';
  }

  if (column === 'status') {
    if (currentSort === 'status_asc') return 'A-Z';
    if (currentSort === 'status_desc') return 'Z-A';
  }

  if (column === 'added') {
    if (currentSort === 'added_desc') return 'Newest';
    if (currentSort === 'added_asc') return 'Oldest';
  }

  if (column === 'location') {
    if (currentSort === 'location_asc') return 'A-Z';
    if (currentSort === 'location_desc') return 'Z-A';
  }

  return '';
}

export function ApplicationsTable({ applications, sort, onSort, onEdit, onDelete, deletingId }: Props) {
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No applications found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <table className="w-full min-w-[880px] text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr style={{ background: 'var(--soft)', borderBottom: '2px solid var(--line)' }}>
            {HEADERS.map(({ key, label, sortColumn }) => (
              <th
                key={key}
                className="text-left text-[11px] font-semibold uppercase tracking-wide px-2 py-3 whitespace-nowrap"
                style={{ color: 'var(--ink-3)' }}
              >
                {sortColumn ? (
                  <button
                    type="button"
                    onClick={() => onSort(sortForColumn(sortColumn, sort))}
                    className="inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase tracking-wide hover:bg-white/70"
                    style={{ color: 'inherit' }}
                  >
                    {label}
                    {sortIndicator(sortColumn, sort) && (
                      <span className="normal-case tracking-normal" style={{ color: 'var(--ink-4)' }}>
                        {sortIndicator(sortColumn, sort)}
                      </span>
                    )}
                  </button>
                ) : label}
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
