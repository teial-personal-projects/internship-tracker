import { useState, useRef, useCallback } from 'react';
import * as Select from '@radix-ui/react-select';
import type { Job, QuickFilter, MinYear } from '@shared/types';
import { MIN_YEAR_RANK } from '@shared/types';
import { isDeadlineSoon } from '@/lib/dateUtils';
import { isJobStaleForStudent } from '@/lib/jobUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

interface Props {
  quickFilter: QuickFilter;
  onQuickFilter: (f: QuickFilter) => void;
  jobs: Job[];
  currentClass?: MinYear | null;
}

interface FilterDef {
  label: string;
  value: QuickFilter;
  getCount: (jobs: Job[], currentClass?: MinYear | null) => number | null;
  dot?: string;
  badgeBg?: string;
  badgeColor?: string;
}

const ALL_FILTERS: FilterDef[] = [
  {
    label: 'All',
    value: 'all',
    getCount: (jobs) => jobs.length,
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
  },
  {
    label: 'In Progress',
    value: 'in_progress',
    dot: '#185FA5',
    getCount: (jobs) => jobs.filter((j) => j.status === 'in_progress').length,
    badgeBg: '#E6F1FB',
    badgeColor: '#185FA5',
  },
  {
    label: 'Not Started',
    value: 'not_started',
    dot: '#9ca3af',
    getCount: (jobs) => jobs.filter((j) => j.status === 'not_started').length,
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
  },
  {
    label: 'Applied',
    value: 'applied',
    dot: '#16a34a',
    getCount: (jobs) => jobs.filter((j) => !!j.applied_date).length,
    badgeBg: '#E6F1FB',
    badgeColor: '#185FA5',
  },
  {
    label: 'Due Soon',
    value: 'due_soon',
    dot: '#ea580c',
    getCount: (jobs) =>
      jobs.filter(
        (j) => !['applied', 'archive'].includes(j.status) && isDeadlineSoon(j.deadline)
      ).length,
    badgeBg: '#FCEBEB',
    badgeColor: '#791F1F',
  },
  {
    label: 'Stale',
    value: 'stale',
    dot: '#d97706',
    getCount: (jobs, currentClass) => jobs.filter((j) => isJobStaleForStudent(j, currentClass)).length,
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
  },
  {
    label: 'Rejected',
    value: 'rejected',
    dot: '#dc2626',
    getCount: (jobs) => jobs.filter((j) => j.status === 'rejected').length,
    badgeBg: '#FCEBEB',
    badgeColor: '#791F1F',
  },
  {
    label: 'Archived',
    value: 'archived',
    dot: '#6b7280',
    getCount: (jobs) => jobs.filter((j) => j.status === 'archive').length,
    badgeBg: '#F1EFE8',
    badgeColor: '#5F5E5A',
  },
  {
    label: 'Above My Class',
    value: 'min_class_not_met',
    dot: '#9333ea',
    getCount: (jobs, currentClass) =>
      currentClass
        ? jobs.filter((j) => j.min_year && MIN_YEAR_RANK[currentClass] < MIN_YEAR_RANK[j.min_year]).length
        : 0,
    badgeBg: '#F3E8FF',
    badgeColor: '#6B21A8',
  },
  {
    label: 'Conference',
    value: 'conference',
    dot: '#7c3aed',
    getCount: (jobs) => jobs.filter((j) => !!j.conference).length,
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
  },
];

const PRIMARY_VALUES: QuickFilter[] = ['all', 'in_progress', 'not_started', 'applied'];
const PRIMARY_FILTERS = ALL_FILTERS.filter((f) => PRIMARY_VALUES.includes(f.value));
const MORE_FILTERS = ALL_FILTERS.filter((f) => !PRIMARY_VALUES.includes(f.value));

export function FilterBar({ quickFilter, onQuickFilter, jobs, currentClass }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  useClickOutside(moreRef, closeMore);

  const activeFilter = ALL_FILTERS.find((f) => f.value === quickFilter)!;
  const activeCount = activeFilter.getCount(jobs, currentClass);
  const activeIsMore = MORE_FILTERS.some((f) => f.value === quickFilter);

  return (
    <>
      {/* Mobile: custom Radix dropdown */}
      <div className="sm:hidden">
        <Select.Root value={quickFilter} onValueChange={(v) => onQuickFilter(v as QuickFilter)}>
          <Select.Trigger className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-md px-4 py-3 bg-white text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <span>
              {activeFilter.label}
              {activeCount !== null ? ` (${activeCount})` : ''}
            </span>
            <Select.Icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 w-(--radix-select-trigger-width) bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport>
                {ALL_FILTERS.map(({ label, value, getCount }) => {
                  const count = getCount(jobs, currentClass);
                  return (
                    <Select.Item
                      key={value}
                      value={value}
                      className="flex items-center justify-between px-4 py-3.5 text-base text-gray-800 cursor-pointer select-none
                                 data-highlighted:bg-brand-50 data-highlighted:outline-none
                                 data-[state=checked]:font-semibold data-[state=checked]:text-brand-800"
                    >
                      <Select.ItemText>
                        {label}{count !== null ? ` (${count})` : ''}
                      </Select.ItemText>
                      <Select.ItemIndicator>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </Select.ItemIndicator>
                    </Select.Item>
                  );
                })}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Desktop: primary pills + "More ▾" dropdown */}
      <div className="hidden sm:flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase shrink-0">Filter</span>

        {/* Scrollable primary pills */}
        <div
          className="flex gap-2 flex-nowrap overflow-x-auto min-w-0 pb-1"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {PRIMARY_FILTERS.map(({ label, value, getCount, dot, badgeBg, badgeColor }) => {
            const isActive = quickFilter === value;
            const count = getCount(jobs, currentClass);

            return (
              <button
                key={value}
                type="button"
                onClick={() => onQuickFilter(value)}
                className={[
                  'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium shrink-0 border-[1.5px] transition-colors',
                  isActive
                    ? 'bg-brand-800 text-white border-brand-800 hover:bg-brand-700 hover:border-brand-700'
                    : 'bg-white text-gray-600 border-gray-400 hover:bg-gray-50 hover:border-gray-500',
                ].join(' ')}
              >
                {dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: isActive ? 'white' : dot }} />
                )}
                {label}
                {count !== null && (
                  <span
                    className="text-[12px] font-bold px-1.5 py-0 rounded-full leading-none"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : badgeBg,
                      color: isActive ? 'white' : badgeColor,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* More ▾ dropdown — outside overflow container so it isn't clipped */}
        <div className="relative shrink-0" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className={[
              'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border-[1.5px] transition-colors',
              activeIsMore
                ? 'bg-brand-800 text-white border-brand-800 hover:bg-brand-700 hover:border-brand-700'
                : 'bg-white text-gray-600 border-gray-400 hover:bg-gray-50 hover:border-gray-500',
            ].join(' ')}
          >
            {activeIsMore ? (
              <>
                {activeFilter.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'white' }} />
                )}
                {activeFilter.label}
                <span
                  className="text-[12px] font-bold px-1.5 py-0 rounded-full leading-none"
                  style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
                >
                  {activeFilter.getCount(jobs, currentClass)}
                </span>
              </>
            ) : (
              'More'
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {moreOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-w-44">
              {MORE_FILTERS.map(({ label, value, getCount, dot, badgeBg, badgeColor }) => {
                const isActive = quickFilter === value;
                const count = getCount(jobs, currentClass);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { onQuickFilter(value); setMoreOpen(false); }}
                    className={[
                      'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors',
                      isActive ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {dot && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    )}
                    <span className="flex-1">{label}</span>
                    {count !== null && (
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                        style={{ background: badgeBg, color: badgeColor }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
