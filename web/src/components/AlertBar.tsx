import type { Job, MinYear } from '@shared/types';
import { isDeadlineSoon, DEADLINE_WINDOW, MAX_STALE_DAYS } from '@/lib/dateUtils';
import { isJobStaleForStudent } from '@/lib/jobUtils';

interface Props {
  jobs: Job[];
  currentClass?: MinYear | null;
}

function AlertPill({
  count,
  label,
  companies,
  bgColor,
  borderColor,
  dotColor,
  textColor,
  boldColor,
}: {
  count: number;
  label: string;
  companies: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  textColor: string;
  boldColor: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ background: bgColor, border: `0.5px solid ${borderColor}` }}
    >
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold shrink-0"
        style={{ background: dotColor, color: boldColor }}
      >
        !
      </span>
      <span className="text-xs font-medium whitespace-nowrap" style={{ color: textColor }}>
        {count === 1 ? `1 ${label}` : `${count} ${label}s`}{companies ? ':' : ''}
      </span>
      {companies && (
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: boldColor }}>
          {companies}
        </span>
      )}
    </div>
  );
}

export function AlertBar({ jobs, currentClass }: Props) {
  const dueSoon = jobs.filter(
    (j) => !['applied', 'archive'].includes(j.status) && isDeadlineSoon(j.deadline)
  );

  const stale = jobs.filter((j) => isJobStaleForStudent(j, currentClass));

  if (!dueSoon.length && !stale.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {dueSoon.length > 0 && (
        <AlertPill
          count={dueSoon.length}
          label={`due within ${DEADLINE_WINDOW} days`}
          companies={dueSoon.map((j) => j.company).join(', ')}
          bgColor="#FFF9E6"
          borderColor="#F5C842"
          dotColor="#F5C842"
          textColor="#7A5A00"
          boldColor="#4A3500"
        />
      )}
      {stale.length > 0 && (
        <AlertPill
          count={stale.length}
          label={`saved ${MAX_STALE_DAYS}+ days without applying`}
          companies=""
          bgColor="#FEF0E6"
          borderColor="#F5A962"
          dotColor="#F5A962"
          textColor="#7A3A00"
          boldColor="#4A2000"
        />
      )}
    </div>
  );
}
