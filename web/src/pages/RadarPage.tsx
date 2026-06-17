import { AppHeader } from '@/components/AppHeader';
import { Search } from 'lucide-react';

export function RadarPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Discover</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
            Job Radar results and promotion tools will appear here.
          </p>
        </div>
        <section className="card flex items-center gap-3 p-5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--soft)' }}
          >
            <Search size={22} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
              Discover is ready for Phase 6
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
              Manual radar refresh, scoring, and promote-to-application workflows are planned next.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
