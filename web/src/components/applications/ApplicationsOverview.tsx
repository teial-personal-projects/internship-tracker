import {
  Archive,
  CircleDashed,
  CircleX,
  FileText,
  Gift,
  LoaderCircle,
  MessagesSquare,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { STATUS_LABELS } from '@/theme';

interface ApplicationsOverviewProps {
  statusCounts: Record<string, number>;
  activeStatus: string;
  isLoading: boolean;
  onStatusSelect: (status: string) => void;
}

interface OverviewItem {
  status: string;
  helper: string;
  Icon: LucideIcon;
  cardClass: string;
  iconClass: string;
  valueClass: string;
}

const OVERVIEW_ITEMS: OverviewItem[] = [
  { status: 'not_started', helper: 'Ready to begin', Icon: CircleDashed, cardClass: 'border-sky-100 bg-sky-50/70', iconClass: 'bg-sky-100 text-sky-700', valueClass: 'text-sky-700' },
  { status: 'in_progress', helper: 'Building momentum', Icon: LoaderCircle, cardClass: 'border-orange-100 bg-orange-50/70', iconClass: 'bg-orange-100 text-orange-700', valueClass: 'text-orange-700' },
  { status: 'applied', helper: 'Sent to employers', Icon: Send, cardClass: 'border-blue-100 bg-blue-50/70', iconClass: 'bg-blue-100 text-blue-700', valueClass: 'text-blue-700' },
  { status: 'interviewing', helper: 'Conversations underway', Icon: MessagesSquare, cardClass: 'border-violet-100 bg-violet-50/70', iconClass: 'bg-violet-100 text-violet-700', valueClass: 'text-violet-700' },
  { status: 'offered', helper: 'Offers received', Icon: Gift, cardClass: 'border-emerald-100 bg-emerald-50/70', iconClass: 'bg-emerald-100 text-emerald-700', valueClass: 'text-emerald-700' },
  { status: 'rejected', helper: 'Closed out', Icon: CircleX, cardClass: 'border-rose-100 bg-rose-50/70', iconClass: 'bg-rose-100 text-rose-700', valueClass: 'text-rose-700' },
  { status: 'archive', helper: 'Stored away', Icon: Archive, cardClass: 'border-slate-200 bg-slate-50', iconClass: 'bg-slate-200 text-slate-600', valueClass: 'text-slate-700' },
];

export function ApplicationsOverview({
  statusCounts,
  activeStatus,
  isLoading,
  onStatusSelect,
}: ApplicationsOverviewProps) {
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <aside className="rounded-lg border bg-white p-3 shadow-sm" style={{ borderColor: 'var(--line)' }}>
      <h2 className="px-1 pb-2 text-sm font-bold" style={{ color: 'var(--ink)' }}>Overview</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
        <OverviewButton
          label="Total Applications"
          helper="All time"
          value={total}
          isLoading={isLoading}
          isActive={!activeStatus}
          Icon={FileText}
          cardClass="border-blue-100 bg-blue-50/70"
          iconClass="bg-blue-100 text-blue-700"
          valueClass="text-blue-700"
          onClick={() => onStatusSelect('')}
        />

        {OVERVIEW_ITEMS.map((item) => (
          <OverviewButton
            key={item.status}
            label={STATUS_LABELS[item.status] ?? item.status}
            helper={item.helper}
            value={statusCounts[item.status] ?? 0}
            isLoading={isLoading}
            isActive={activeStatus === item.status}
            Icon={item.Icon}
            cardClass={item.cardClass}
            iconClass={item.iconClass}
            valueClass={item.valueClass}
            onClick={() => onStatusSelect(item.status)}
          />
        ))}
      </div>
    </aside>
  );
}

interface OverviewButtonProps extends Omit<OverviewItem, 'status'> {
  label: string;
  value: number;
  isLoading: boolean;
  isActive: boolean;
  onClick: () => void;
}

function OverviewButton({
  label,
  helper,
  value,
  isLoading,
  isActive,
  Icon,
  cardClass,
  iconClass,
  valueClass,
  onClick,
}: OverviewButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 ${cardClass} ${isActive ? 'ring-2 ring-[var(--accent)] ring-offset-1' : ''}`}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold" style={{ color: 'var(--ink)' }}>{label}</span>
          <span className="block truncate text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>{helper}</span>
        </span>
      </span>
      <span className={`shrink-0 text-xl font-bold tabular-nums ${valueClass}`}>
        {isLoading ? '…' : value}
      </span>
    </button>
  );
}
