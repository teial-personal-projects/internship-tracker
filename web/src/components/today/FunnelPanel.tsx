import type { TodayFunnelBucket } from '@shared/schemas';

interface FunnelPanelProps {
  buckets: TodayFunnelBucket[];
}

function formatPercent(percent: number): string {
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

export function FunnelPanel({ buckets }: FunnelPanelProps) {
  const hasApplications = buckets.some((bucket) => bucket.count > 0);

  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Funnel
        </h3>
      </div>

      {!hasApplications ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          No applications in this cycle yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {buckets.map((bucket) => (
            <div key={bucket.key}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {bucket.label}
                </span>
                <span className="text-sm tabular-nums" style={{ color: 'var(--ink-3)' }}>
                  {bucket.count} · {formatPercent(bucket.percent)}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full"
                style={{ background: 'var(--line-soft)' }}
                role="progressbar"
                aria-label={`${bucket.label} conversion`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={bucket.percent}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${bucket.percent}%`, background: 'var(--accent)' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
