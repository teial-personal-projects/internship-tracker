import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import { StatCards } from '@/components/today/StatCards';
import { UpNextCard } from '@/components/today/UpNextCard';
import { useToday } from '@/hooks/useToday';
import { useAuth } from '@/contexts/AuthContext';
import { buildTodaySummary } from '@/lib/todaySummary';
import type { ReactNode } from 'react';

function PanelShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
      {children}
    </p>
  );
}

export function TodayPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useToday();
  const firstName = typeof user?.user_metadata?.first_name === 'string' && user.user_metadata.first_name.trim()
    ? user.user_metadata.first_name.trim()
    : 'there';

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />

      <main className="mobile-safe-bottom flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 md:pb-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <header className="max-w-3xl">
            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'var(--ink)', fontFamily: "'Fraunces', serif" }}
            >
              Good morning,{' '}
              <span style={{ color: 'var(--accent)' }}>
                {firstName}
              </span>
              .
            </h2>
            {data && (
              <p className="mt-2 text-base leading-7" style={{ color: 'var(--ink-2)' }}>
                {buildTodaySummary(data)}
              </p>
            )}
          </header>

          {isLoading && (
            <div className="flex items-center justify-center rounded-lg border bg-white py-16" style={{ borderColor: 'var(--line)' }}>
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}>
              Failed to load today.
            </div>
          )}

          {data && (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-w-0 flex-col gap-5">
                <StatCards stats={data.stats} />

                <PanelShell title="Up next">
                  <UpNextCard interview={data.up_next[0] ?? null} />
                </PanelShell>

                <PanelShell title="Action items">
                  <EmptyLine>{data.action_items.length ? `${data.action_items.length} open` : 'No open action items.'}</EmptyLine>
                </PanelShell>

                <PanelShell title="Need attention">
                  <EmptyLine>{data.need_attention.length ? `${data.need_attention.length} active` : 'Nothing in active stages right now.'}</EmptyLine>
                </PanelShell>
              </div>

              <aside className="flex min-w-0 flex-col gap-5">
                <PanelShell title="Funnel">
                  <EmptyLine>{data.funnel.some((bucket) => bucket.count > 0) ? `${data.funnel.length} stages` : 'No applications in this cycle yet.'}</EmptyLine>
                </PanelShell>

                <PanelShell title="Overdue follow-ups">
                  <EmptyLine>{data.overdue_follow_ups.length ? `${data.overdue_follow_ups.length} overdue` : "You're current on follow-ups."}</EmptyLine>
                </PanelShell>

                <PanelShell title="Recent contacts">
                  <EmptyLine>{data.recent_contacts.length ? `${data.recent_contacts.length} recent` : 'No contacts yet.'}</EmptyLine>
                </PanelShell>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
