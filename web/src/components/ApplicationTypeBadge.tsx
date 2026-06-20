import type { ApplicationType } from '@shared/schemas';
import { APPLICATION_TYPE_COLORS, APPLICATION_TYPE_LABELS } from '@/theme';

interface Props {
  type: ApplicationType | null | undefined;
}

export function ApplicationTypeBadge({ type }: Props) {
  if (!type) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
        style={{ border: '1px dashed #D1D5DB', color: '#9CA3AF', background: 'transparent' }}
      >
        Not set
      </span>
    );
  }

  const { bg, color, border } = APPLICATION_TYPE_COLORS[type] ?? APPLICATION_TYPE_COLORS.other;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: bg, color, border: border ?? 'none' }}
    >
      {APPLICATION_TYPE_LABELS[type] ?? type}
    </span>
  );
}
