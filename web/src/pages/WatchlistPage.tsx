import { AppHeader } from '@/components/AppHeader';
import { Building2 } from 'lucide-react';

export function WatchlistPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Companies To Watch
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
            Target companies and watchlist promotion tools will appear here.
          </p>
        </div>
        <section className="card flex items-center gap-3 p-5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--soft)' }}
          >
            <Building2 size={22} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
              Watchlist is ready for Phase 5
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
              Company tracking, notes, and promote-to-application workflows are planned next.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
