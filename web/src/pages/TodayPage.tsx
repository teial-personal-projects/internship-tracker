import { AppHeader } from '@/components/AppHeader';

export function TodayPage() {
  return (
    <div className="min-h-screen mobile-safe-bottom" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--ink)', fontFamily: "'Fraunces', serif" }}
        >
          Today
        </h2>
      </main>
    </div>
  );
}
