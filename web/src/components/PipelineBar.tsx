import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

const PIPELINE_STAGES = [
  'not_started',
  'in_progress',
  'applied',
  'screening',
  'interviewing',
  'technical',
  'on_site',
  'final_round',
  'offered',
] as const;

const TERMINAL_STAGES = ['rejected', 'withdrawn', 'archive'] as const;

interface Props {
  statusCounts: Record<string, number>;
  activeStatus: string;
  onStatusClick: (status: string) => void;
}

interface StageChipProps {
  status: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function StageChip({ status, count, isActive, onClick }: StageChipProps) {
  const colors = STATUS_COLORS[status] ?? { bg: '#F3E9D7', color: '#8A93AE', dot: '#8A93AE' };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all border"
      style={{
        background: isActive ? colors.color : colors.bg,
        color: isActive ? 'white' : colors.color,
        borderColor: colors.color,
        boxShadow: isActive ? `0 0 0 2px ${colors.color}40` : 'none',
      }}
    >
      {STATUS_LABELS[status] ?? status}
      {count > 0 && (
        <span
          className="min-w-4 text-center leading-none px-1 rounded-full text-[10px] font-bold"
          style={{
            background: isActive ? 'rgba(255,255,255,0.25)' : colors.color,
            color: isActive ? 'white' : colors.bg,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function PipelineBar({ statusCounts, activeStatus, onStatusClick }: Props) {
  const total = Object.values(statusCounts).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-lg border px-3 py-2.5 bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ink-3)' }}>
          Pipeline
        </span>
        <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>
          · {total} total
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PIPELINE_STAGES.map(s => (
          <StageChip
            key={s}
            status={s}
            count={statusCounts[s] ?? 0}
            isActive={activeStatus === s}
            onClick={() => onStatusClick(activeStatus === s ? '' : s)}
          />
        ))}
        {TERMINAL_STAGES.map(s =>
          (statusCounts[s] ?? 0) > 0 ? (
            <StageChip
              key={s}
              status={s}
              count={statusCounts[s]}
              isActive={activeStatus === s}
              onClick={() => onStatusClick(activeStatus === s ? '' : s)}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
