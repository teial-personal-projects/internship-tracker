import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import { useToday } from '@/hooks/useToday';

function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
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

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
      {children}
    </p>
  );
}

export function TodayPage() {
  const { data, isLoading, error } = useToday();

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />

      <main className="mobile-safe-bottom flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 md:pb-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <header>
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--ink)', fontFamily: "'Fraunces', serif" }}
            >
              Today
            </h2>
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
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Applications', data.stats.applications],
                    ['Phone screens', data.stats.phone_screens],
                    ['Open tasks', data.stats.open_tasks],
                    ['Interviews this week', data.stats.interviews_this_week],
                  ].map(([label, value]) => (
                    <article key={label} className="rounded-lg border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                        {label}
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                        {value}
                      </p>
                    </article>
                  ))}
                </section>

                <PanelShell title="Up next">
                  <EmptyLine>{data.up_next.length ? data.up_next[0].application_company : 'No interviews scheduled.'}</EmptyLine>
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
