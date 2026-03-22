import type { Job } from '@shared/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

interface Props {
  job: Job;
}

export function StatusBadge({ job }: Props) {
  const colors = STATUS_COLORS[job.status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
      style={{ background: colors?.bg ?? '#F1EFE8' }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: colors?.dot ?? '#888780' }}
      />
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: colors?.color ?? '#444441' }}
      >
        {STATUS_LABELS[job.status] ?? job.status}
      </span>
    </span>
  );
}
