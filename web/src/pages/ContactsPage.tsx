import { AppHeader } from '@/components/AppHeader';
import { ApplicationEventLog } from '@/components/ApplicationEventLog';
import { ApplicationTypeBadge } from '@/components/ApplicationTypeBadge';
import { Spinner } from '@/components/Spinner';
import { useApplication } from '@/hooks/useApplications';
import { ArrowLeft, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function ContactsPage() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('application_id');
  const { data: application, isLoading, error } = useApplication(applicationId);

  if (applicationId) {
    return (
      <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
            <Link
              to="/applications"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--ink-3)' }}
            >
              <ArrowLeft size={16} />
              Applications
            </Link>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : error || !application ? (
              <div className="rounded-xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
                <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Application not found</h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
                  Return to Applications and choose another record.
                </p>
              </div>
            ) : (
              <>
                <section className="rounded-xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
                        {application.company}
                      </h1>
                      <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{application.title}</p>
                    </div>
                    <ApplicationTypeBadge type={application.application_type} />
                  </div>
                </section>

                <ApplicationEventLog applicationId={application.id} />
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-6 pb-20 md:pb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--soft)' }}
        >
          <Users size={26} strokeWidth={1.5} style={{ color: 'var(--ink-3)' }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Contacts</h1>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--ink-3)' }}>
          Your company contacts and recruiters will appear here.
        </p>
      </main>
    </div>
  );
}
