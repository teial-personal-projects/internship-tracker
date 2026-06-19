import type { TodayStats } from '@shared/schemas';

interface StatCardConfig {
  key: keyof TodayStats;
  label: string;
  emptyHint: string;
}

interface StatCardsProps {
  stats: TodayStats;
}

const STAT_CARDS: StatCardConfig[] = [
  { key: 'applications', label: 'Applications', emptyHint: 'No applications yet' },
  { key: 'phone_screens', label: 'Phone screens', emptyHint: 'No screens scheduled' },
  { key: 'open_tasks', label: 'Open tasks', emptyHint: 'No open tasks' },
  { key: 'interviews_this_week', label: 'Interviews this week', emptyHint: 'No interviews this week' },
];

export function StatCards({ stats }: StatCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Today stats">
      {STAT_CARDS.map(({ key, label, emptyHint }) => {
        const value = stats[key];

        return (
          <article
            key={key}
            className="rounded-lg border bg-white p-4"
            style={{ borderColor: 'var(--line)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {value}
            </p>
            {value === 0 && (
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
                {emptyHint}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
