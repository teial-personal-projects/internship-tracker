import type { Job } from '@shared/types';
import { isDeadlineSoon, isStaleJob } from '@/lib/dateUtils';

interface Props {
  jobs: Job[];
}

export function AlertBar({ jobs }: Props) {
  const dueSoon = jobs.filter(
    (j) => !['applied', 'archive'].includes(j.status) && isDeadlineSoon(j.deadline)
  );

  const stale = jobs.filter((j) => isStaleJob(j.added, j.status));

  if (!dueSoon.length && !stale.length) return null;

  return (
    <div className="flex items-start gap-3 p-3 mb-4 bg-orange-50 border border-orange-200 border-l-4 border-l-orange-400 rounded-md">
      <span className="text-orange-400 text-base mt-0.5 flex-shrink-0">⚠️</span>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {dueSoon.length > 0 && (
          <div>
            <span className="font-semibold text-sm text-orange-700">
              {dueSoon.length === 1 ? '1 application' : `${dueSoon.length} applications`} due within 3 days:{' '}
            </span>
            <span className="text-sm text-orange-800">
              {dueSoon.map((j) => j.company).join(', ')}
            </span>
          </div>
        )}
        {stale.length > 0 && (
          <div>
            <span className="font-semibold text-sm text-orange-700">
              {stale.length === 1 ? '1 job' : `${stale.length} jobs`} saved 7+ days without applying:{' '}
            </span>
            <span className="text-sm text-orange-800">
              {stale.map((j) => j.company).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
