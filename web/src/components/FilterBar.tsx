import * as Select from '@radix-ui/react-select';
import type { Job, QuickFilter } from '@shared/types';
import { isDeadlineSoon, isStaleJob } from '@/lib/dateUtils';

interface Props {
  quickFilter: QuickFilter;
  onQuickFilter: (f: QuickFilter) => void;
  jobs: Job[];
}

interface FilterDef {
  label: string;
  value: QuickFilter;
  getCount: (jobs: Job[]) => number | null;
  badgeBg?: string;
  badgeColor?: string;
}

const FILTERS: FilterDef[] = [
  {
    label: 'Active',
    value: 'active',
    getCount: (jobs) => jobs.filter((j) => ['not_started', 'in_progress', 'interviewing'].includes(j.status)).length,
    badgeBg: 'whiteAlpha.300',
    badgeColor: 'white',
  },
  {
    label: 'Not Started',
    value: 'not_started',
    getCount: (jobs) => jobs.filter((j) => j.status === 'not_started').length,
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
  },
  {
    label: 'Applied',
    value: 'applied',
    getCount: (jobs) => jobs.filter((j) => !!j.applied_date).length,
    badgeBg: '#E6F1FB',
    badgeColor: '#185FA5',
  },
  {
    label: 'Due Soon',
    value: 'due_soon',
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
    getCount: (jobs) => jobs.filter((j) => isStaleJob(j.added, j.status)).length,
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
  },
  {
    label: 'Archived',
    value: 'archived',
    getCount: (jobs) => jobs.filter((j) => j.status === 'archive').length,
    badgeBg: '#F1EFE8',
    badgeColor: '#5F5E5A',
  },
  {
    label: 'Conference',
    value: 'conference',
    getCount: (jobs) => jobs.filter((j) => !!j.conference).length,
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
  },
  {
    label: 'All',
    value: 'all',
    getCount: (jobs) => jobs.length,
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
  },
];

export function FilterBar({ quickFilter, onQuickFilter, jobs }: Props) {
  const active = FILTERS.find((f) => f.value === quickFilter)!;
  const activeCount = active.getCount(jobs);

  return (
    <>
      {/* Mobile: custom Radix dropdown */}
      <div className="sm:hidden">
        <Select.Root value={quickFilter} onValueChange={(v) => onQuickFilter(v as QuickFilter)}>
          <Select.Trigger className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-md px-4 py-3 bg-white text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <span>
              {active.label}
              {activeCount !== null && activeCount > 0 ? ` (${activeCount})` : ''}
            </span>
            <Select.Icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 w-[var(--radix-select-trigger-width)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport>
                {FILTERS.map(({ label, value, getCount }) => {
                  const count = getCount(jobs);
                  return (
                    <Select.Item
                      key={value}
                      value={value}
                      className="flex items-center justify-between px-4 py-3.5 text-base text-gray-800 cursor-pointer select-none
                                 data-[highlighted]:bg-brand-50 data-[highlighted]:outline-none
                                 data-[state=checked]:font-semibold data-[state=checked]:text-brand-800"
                    >
                      <Select.ItemText>
                        {label}{count !== null && count > 0 ? ` (${count})` : ''}
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

      {/* Desktop: pill buttons */}
      <div
        className="hidden sm:block mb-2 -mx-4 px-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        <div className="flex gap-2 flex-nowrap min-w-max pb-1">
          {FILTERS.map(({ label, value, getCount, badgeBg, badgeColor }) => {
            const isActive = quickFilter === value;
            const count = getCount(jobs);
            const showCount = count !== null && count > 0;

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
                {label}
                {showCount && (
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
      </div>
    </>
  );
}
