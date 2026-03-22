import { useState, useRef } from 'react';
import type { Job } from '@shared/types';
import { JobRow } from './JobRow';
import type { ColKey } from './JobRow';

type SortDir = 'asc' | 'desc';

interface ColDef {
  key: ColKey;
  label: string;
  sortFn?: (a: Job, b: Job) => number;
}

const STR = (v: string | null | undefined) => v ?? '';

const ALL_COLS: ColDef[] = [
  { key: 'added',        label: 'Added',         sortFn: (a, b) => STR(a.added).localeCompare(STR(b.added)) },
  { key: 'status',       label: 'Status',        sortFn: (a, b) => a.status.localeCompare(b.status) },
  { key: 'company',      label: 'Company',       sortFn: (a, b) => STR(a.company).localeCompare(STR(b.company)) },
  { key: 'title',        label: 'Title',         sortFn: (a, b) => STR(a.title).localeCompare(STR(b.title)) },
  { key: 'industry',     label: 'Industry',      sortFn: (a, b) => STR(a.industry).localeCompare(STR(b.industry)) },
  { key: 'location',     label: 'Location',      sortFn: (a, b) => STR(a.location).localeCompare(STR(b.location)) },
  { key: 'applied',      label: 'Applied',       sortFn: (a, b) => STR(a.applied_date).localeCompare(STR(b.applied_date)) },
  { key: 'deadline',     label: 'Deadline',      sortFn: (a, b) => STR(a.deadline).localeCompare(STR(b.deadline)) },
  { key: 'job_link',     label: 'Job Link' },
  { key: 'app_link',     label: 'App Link' },
  { key: 'cover_letter', label: 'Cover' },
  { key: 'pay',          label: 'Pay',           sortFn: (a, b) => STR(a.pay).localeCompare(STR(b.pay)) },
  { key: 'notes',        label: 'Notes' },
  { key: 'conference',   label: 'Conf',          sortFn: (a, b) => STR(a.conference).localeCompare(STR(b.conference)) },
  { key: 'actions',      label: 'Actions' },
];

const COL_MAP = Object.fromEntries(ALL_COLS.map(c => [c.key, c])) as Record<ColKey, ColDef>;
const DEFAULT_ORDER: ColKey[] = ALL_COLS.map(c => c.key);
const LS_KEY = 'jobs-col-order';

function loadOrder(): ColKey[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ColKey[];
      if (Array.isArray(parsed) && parsed.every(k => COL_MAP[k as ColKey])) {
        // ensure any new columns added since save are appended
        const missing = DEFAULT_ORDER.filter(k => !parsed.includes(k));
        return [...parsed, ...missing];
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER;
}

interface Props {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  applyingId?: string | null;
  deletingId?: string | null;
}

export function JobsTable({
  jobs,
  onEdit,
  onDelete,
  onMarkApplied,
  applyingId,
  deletingId,
}: Props) {
  const [colOrder, setColOrder] = useState<ColKey[]>(loadOrder);
  const [sortKey, setSortKey] = useState<ColKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dragOver, setDragOver] = useState<ColKey | null>(null);
  const dragSrc = useRef<ColKey | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p>No jobs here. Add one to get started!</p>
      </div>
    );
  }

  function handleSort(key: ColKey) {
    if (!COL_MAP[key].sortFn) return;
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedJobs =
    sortKey && COL_MAP[sortKey].sortFn
      ? [...jobs].sort((a, b) => {
          const cmp = COL_MAP[sortKey].sortFn!(a, b);
          return sortDir === 'asc' ? cmp : -cmp;
        })
      : jobs;

  function handleDragStart(key: ColKey) {
    dragSrc.current = key;
  }

  function handleDragOver(e: React.DragEvent, key: ColKey) {
    e.preventDefault();
    setDragOver(key);
  }

  function handleDrop(target: ColKey) {
    const src = dragSrc.current;
    if (!src || src === target) { setDragOver(null); return; }
    setColOrder(prev => {
      const next = [...prev];
      const si = next.indexOf(src);
      const ti = next.indexOf(target);
      next.splice(si, 1);
      next.splice(ti, 0, src);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    dragSrc.current = null;
    setDragOver(null);
  }

  function handleDragEnd() {
    dragSrc.current = null;
    setDragOver(null);
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {colOrder.map(key => {
              const col = COL_MAP[key];
              const isSorted = sortKey === key;
              const canSort = !!col.sortFn;
              const isDropTarget = dragOver === key;

              return (
                <th
                  key={key}
                  className={[
                    'text-xs font-semibold uppercase tracking-wide py-3 px-4 whitespace-nowrap border-b-2 text-left select-none transition-colors',
                    isDropTarget
                      ? 'bg-brand-100 border-brand-400'
                      : 'bg-brand-50 border-brand-200 hover:bg-brand-100',
                    'text-brand-700',
                    canSort ? 'cursor-pointer' : key === 'actions' ? 'cursor-default' : 'cursor-grab',
                  ].join(' ')}
                  draggable={key !== 'actions'}
                  onDragStart={() => handleDragStart(key)}
                  onDragOver={e => handleDragOver(e, key)}
                  onDrop={() => handleDrop(key)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(key)}
                  {...(key === 'actions' ? {
                    style: { position: 'sticky', right: 0, zIndex: 1, boxShadow: '-2px 0 6px rgba(0,0,0,0.06)' },
                  } : {})}
                >
                  {col.label}
                  {isSorted && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedJobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              colOrder={colOrder}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkApplied={onMarkApplied}
              isApplying={applyingId === job.id}
              isDeleting={deletingId === job.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
