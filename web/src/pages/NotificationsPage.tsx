import { AppHeader } from '@/components/AppHeader';
import { Bell } from 'lucide-react';

export function NotificationsPage() {
  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-6 pb-20 md:pb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--soft)' }}
        >
          <Bell size={26} strokeWidth={1.5} style={{ color: 'var(--ink-3)' }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Notifications</h1>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--ink-3)' }}>
          Your notification preferences and inbox will appear here.
        </p>
      </main>
    </div>
  );
}
