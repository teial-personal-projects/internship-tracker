import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Application, CreateApplicationSchemaType } from '@shared/schemas';
import {
  useApplication,
  useApplications,
  useApplicationStats,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
} from '@/hooks/useApplications';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import { Pagination } from '@/components/Pagination';
import { ApplicationsTable } from '@/components/ApplicationsTable';
import { ApplicationCardList } from '@/components/ApplicationCardList';
import { ApplicationsOverview } from '@/components/applications/ApplicationsOverview';
import {
  ApplicationsFilters,
  type ApplicationSort,
} from '@/components/applications/ApplicationsFilters';
import { ApplicationModal, type ApplicationFormValues } from '@/components/ApplicationModal';
import { getApplicationsContentState } from '@/lib/applicationsContentState';
import { buildApplicationsListParams, hasApplicationListFilters, toggleStatusFilter } from '@/lib/applicationsListParams';
import { todayStr } from '@/lib/dateUtils';
import { getAppliedDateForStatusChange } from '@/lib/applicationAppliedDate';

const APPLICATIONS_PAGE_LIMIT = 10;

export function ApplicationsPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const applicationIdParam = searchParams.get('application_id');

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<ApplicationSort>('added_desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const queryParams = useMemo(() => buildApplicationsListParams({
    statusFilter,
    search,
    dateFrom,
    dateTo,
    sort,
    page,
    limit: APPLICATIONS_PAGE_LIMIT,
    showArchived,
  }), [statusFilter, search, dateFrom, dateTo, sort, page, showArchived]);

  const { data, isLoading, error } = useApplications(queryParams);
  const { data: routedApplication } = useApplication(applicationIdParam);
  const { data: applicationStats, isLoading: isApplicationStatsLoading } = useApplicationStats();

  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();

  const applications = data?.data ?? [];
  const applicationStatusCounts = applicationStats?.status_counts ?? {};
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = hasApplicationListFilters({
    statusFilter,
    search,
    dateFrom,
    dateTo,
  });
  const contentState = getApplicationsContentState({ isLoading, total, hasFilters });

  function setPage(newPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newPage === 1) { next.delete('page'); } else { next.set('page', String(newPage)); }
      return next;
    });
  }

  function resetPage() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    });
  }

  function handleStatusClick(status: string) {
    setStatusFilter((current) => toggleStatusFilter(current, status));
    if (status === 'archive') setShowArchived(true);
    resetPage();
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status);
    if (status === 'archive') setShowArchived(true);
    resetPage();
  }

  function handleSearch(q: string) { setSearch(q); resetPage(); }
  function handleDateFrom(d: string) { setDateFrom(d); resetPage(); }
  function handleDateTo(d: string) { setDateTo(d); resetPage(); }
  function handleSort(nextSort: ApplicationSort) { setSort(nextSort); resetPage(); }
  function clearFilters() {
    setStatusFilter('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSort('added_desc');
    setShowArchived(false);
    resetPage();
  }

  const modalDefaultValues = useMemo(
    () => editingApp ?? { added: todayStr() },
    [editingApp],
  );

  async function handleSubmit(formData: ApplicationFormValues) {
    const appType = formData.application_type;
    const appliedDate = getAppliedDateForStatusChange({
      previousStatus: editingApp?.status ?? 'not_started',
      nextStatus: formData.status,
      currentAppliedDate: formData.applied_date,
      today: todayStr(),
    });
    const payload: CreateApplicationSchemaType = {
      ...formData,
      applied_date: appliedDate,
      application_type: appType || 'cold_strategic',
      source: editingApp?.source ?? 'manual',
      source_metadata: editingApp?.source_metadata ?? {},
    };
    try {
      if (editingApp) {
        await updateApp.mutateAsync({ id: editingApp.id, data: payload });
        toast.success('Application updated');
      } else {
        await createApp.mutateAsync(payload);
        toast.success('Application added');
      }
      setEditingApp(null);
      setIsModalOpen(false);
    } catch {
      toast.error('Something went wrong');
    }
  }

  function handleEdit(app: Application) { setEditingApp(app); setIsModalOpen(true); }
  function openAdd() { setEditingApp(null); setIsModalOpen(true); }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteApp.mutateAsync(id);
      toast.success('Application deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!routedApplication || isModalOpen || editingApp) return;

    setEditingApp(routedApplication);
    setIsModalOpen(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('application_id');
      return next;
    }, { replace: true });
  }, [editingApp, isModalOpen, routedApplication, setSearchParams]);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />

      <main className="mobile-safe-bottom flex-1 flex flex-col gap-2 p-3 sm:p-4 md:pb-6 overflow-x-hidden overflow-y-auto">
        <section className="flex flex-col gap-3 rounded-lg border border-l-4 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--line)', borderLeftColor: 'var(--accent)' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Applications</h1>
            <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--ink-3)' }}>
              Search, filter, and move every opportunity through your pipeline.
            </p>
          </div>
          <NewApplicationButton onClick={openAdd} />
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
            <span>⚠️</span> Failed to load applications. Please refresh.
          </div>
        )}

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 rounded-lg border bg-white p-3 shadow-sm sm:p-4" style={{ borderColor: 'var(--line)' }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>All Applications</h2>
                <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{total} matching applications</p>
              </div>
            </div>

            <ApplicationsFilters
              search={search}
              status={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              sort={sort}
              statusCounts={applicationStatusCounts}
              onSearchChange={handleSearch}
              onStatusChange={handleStatusChange}
              onDateFromChange={handleDateFrom}
              onDateToChange={handleDateTo}
              onSortChange={handleSort}
              onReset={clearFilters}
            />

            <div className="my-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowArchived((value) => !value)}
                className="inline-flex min-h-9 items-center rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition"
                style={{ borderColor: showArchived ? 'var(--accent)' : 'var(--line)', color: showArchived ? 'var(--accent)' : 'var(--ink-3)' }}
              >
                {showArchived ? 'Archived included' : 'Include archived'}
              </button>
            </div>

            <section className="flex min-w-0 flex-col gap-2">
          {/* Pagination (top) */}
          {!isLoading && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={APPLICATIONS_PAGE_LIMIT}
              onPageChange={setPage}
            />
          )}

          {(totalPages <= 1 || isLoading) && (
            <ApplicationsListHeader
              total={total}
            />
          )}

          {/* List */}
          {contentState === 'loading' ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : contentState === 'onboarding-empty' ? (
            <ApplicationOnboardingEmptyState onAdd={openAdd} />
          ) : contentState === 'filtered-empty' ? (
            <FilteredEmptyState onClearFilters={clearFilters} />
          ) : isMobile ? (
            <ApplicationCardList
              applications={applications}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ) : (
            <ApplicationsTable
              applications={applications}
              sort={sort}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}

          {/* Pagination (bottom) */}
          {!isLoading && totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={total} limit={APPLICATIONS_PAGE_LIMIT} onPageChange={setPage} />
          )}
            </section>
          </div>

          <ApplicationsOverview
            statusCounts={applicationStatusCounts}
            activeStatus={statusFilter}
            isLoading={isApplicationStatsLoading}
            onStatusSelect={handleStatusClick}
          />
        </div>
      </main>

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => { setEditingApp(null); setIsModalOpen(false); }}
        onSubmit={handleSubmit}
        isLoading={createApp.isPending || updateApp.isPending}
        defaultValues={modalDefaultValues as Partial<Application>}
        title={editingApp ? 'Edit Application' : 'Add Application'}
      />
    </div>
  );
}

function ApplicationsListHeader({ total, action }: { total: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-2" style={{ borderColor: 'var(--line)' }}>
      <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
        {total > 0 ? `${total} applications` : '0 applications'}
      </span>
      {action}
    </div>
  );
}

function NewApplicationButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-primary px-3 py-1.5 text-sm">
      + New Application
    </button>
  );
}

function ApplicationOnboardingEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-white px-6 py-12 text-center" style={{ borderColor: 'var(--line)' }}>
      <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
        Add your first application
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6" style={{ color: 'var(--ink-3)' }}>
        Start tracking companies, roles, follow-ups, and interview progress in one place.
      </p>
      <button type="button" onClick={onAdd} className="btn-primary mt-5 px-4 py-2 text-sm">
        + Add application
      </button>
    </div>
  );
}

function FilteredEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-white px-6 py-12 text-center" style={{ borderColor: 'var(--line)' }}>
      <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
        No applications match these filters
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6" style={{ color: 'var(--ink-3)' }}>
        Clear the active filters to return to your full applications list.
      </p>
      <button type="button" onClick={onClearFilters} className="btn-outline mt-5 px-4 py-2 text-sm">
        Clear filters
      </button>
    </div>
  );
}
