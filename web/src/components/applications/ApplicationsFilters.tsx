import { CalendarDays, RotateCcw, Search } from 'lucide-react';
import { STATUS_LABELS } from '@/theme';

const FILTER_STATUSES = [
  'not_started',
  'in_progress',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'archive',
] as const;

export type ApplicationSort =
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

interface ApplicationsFiltersProps {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  sort: ApplicationSort;
  statusCounts: Record<string, number>;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSortChange: (value: ApplicationSort) => void;
  onReset: () => void;
}

export function ApplicationsFilters({
  search,
  status,
  dateFrom,
  dateTo,
  sort,
  statusCounts,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onReset,
}: ApplicationsFiltersProps) {
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Search applications by company, role, or location</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search company, role, or location…"
          className="min-h-11 w-full rounded-lg border bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(16rem,1.4fr)_minmax(11rem,1fr)_auto] xl:items-end">
        <FilterLabel label="Filter by status">
          <select
            aria-label="Filter by status"
            className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-2)' }}
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="">All statuses ({total})</option>
            {FILTER_STATUSES.map((item) => (
              <option key={item} value={item}>{STATUS_LABELS[item]} ({statusCounts[item] ?? 0})</option>
            ))}
          </select>
        </FilterLabel>

        <FilterLabel label="Filter by applied date">
          <span className="flex min-h-11 items-center gap-2 rounded-lg border bg-white px-3" style={{ borderColor: 'var(--line)' }}>
            <CalendarDays className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-4)' }} aria-hidden="true" />
            <input aria-label="Applied from" type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--ink-2)' }} />
            <span aria-hidden="true" style={{ color: 'var(--ink-4)' }}>–</span>
            <input aria-label="Applied through" type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--ink-2)' }} />
          </span>
        </FilterLabel>

        <FilterLabel label="Sort by">
          <select
            aria-label="Sort applications"
            className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-2)' }}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ApplicationSort)}
          >
            <option value="added_desc">Recently added</option>
            <option value="added_asc">Oldest added</option>
            <option value="applied_desc">Recently applied</option>
            <option value="applied_asc">Oldest applied</option>
            <option value="company_asc">Company A–Z</option>
            <option value="company_desc">Company Z–A</option>
            <option value="status_asc">Status A–Z</option>
            <option value="location_asc">Location A–Z</option>
          </select>
        </FilterLabel>

        <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-[var(--soft)]" style={{ color: 'var(--ink-3)' }}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-3)' }}>{label}</span>
      {children}
    </label>
  );
}
