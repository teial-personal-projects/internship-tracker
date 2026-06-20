import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Columns3, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Application, ApplicationStatus, CreateApplicationSchemaType } from '@shared/schemas';
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
import { ApplicationsKanbanBoard } from '@/components/applications/ApplicationsKanbanBoard';
import { ApplicationsRail } from '@/components/applications/ApplicationsRail';
import { ApplicationModal, type ApplicationFormValues } from '@/components/ApplicationModal';
import { getApplicationsContentState } from '@/lib/applicationsContentState';
import { buildApplicationsListParams, hasApplicationListFilters, toggleStatusFilter } from '@/lib/applicationsListParams';
import { getApplicationsPaging, GRID_PAGE_LIMIT, KANBAN_PAGE_LIMIT, shouldShowKanbanLimitHint } from '@/lib/applicationsLoading';
import {
  applyOptimisticStatus,
  applyOptimisticStatuses,
  reconcileOptimisticStatuses,
  rollbackOptimisticStatus,
} from '@/lib/applicationsOptimisticStatus';
import {
  getApplicationsView,
  setApplicationsViewParam,
  type ApplicationsView,
} from '@/lib/applicationsView';
import { todayStr } from '@/lib/dateUtils';

const TODAY = todayStr();
type ApplicationSort =
  | 'added_desc'
  | 'added_asc'
  | 'applied_desc'
  | 'applied_asc'
  | 'company_asc'
  | 'company_desc'
  | 'status_asc'
  | 'status_desc'
  | 'location_asc'
  | 'location_desc';

export function ApplicationsPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const applicationIdParam = searchParams.get('application_id');
  const view = getApplicationsView(searchParams.get('view'));

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<ApplicationSort>('added_desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, ApplicationStatus>>({});
  const paging = useMemo(() => getApplicationsPaging(view, page), [page, view]);

  const queryParams = useMemo(() => buildApplicationsListParams({
    statusFilter,
    search,
    dateFrom,
    dateTo,
    sort,
    page: paging.page,
    limit: paging.limit,
  }), [statusFilter, search, dateFrom, dateTo, sort, paging]);

  const { data, isLoading, error } = useApplications(queryParams);
  const { data: stats } = useApplicationStats();
  const { data: routedApplication } = useApplication(applicationIdParam);

  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();

  const applications = data?.data ?? [];
  const visibleApplications = useMemo(
    () => applyOptimisticStatuses(applications, optimisticStatuses),
    [applications, optimisticStatuses],
  );
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const statusCounts = stats?.status_counts ?? {};
  const hasFilters = hasApplicationListFilters({
    statusFilter,
    search,
    dateFrom,
    dateTo,
  });
  const isKanbanView = view === 'kanban';
  const showKanbanLimitHint = shouldShowKanbanLimitHint(view, total);
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
    resetPage();
  }

  function handleSearch(q: string) { setSearch(q); resetPage(); }
  function handleDateFrom(d: string) { setDateFrom(d); resetPage(); }
  function handleDateTo(d: string) { setDateTo(d); resetPage(); }
  function handleSort(nextSort: ApplicationSort) { setSort(nextSort); resetPage(); }
  function handleViewChange(nextView: ApplicationsView) {
    setSearchParams((prev) => setApplicationsViewParam(prev, nextView));
  }
  function clearFilters() {
    setStatusFilter('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    resetPage();
  }

  const modalDefaultValues = useMemo(
    () => editingApp ?? { added: TODAY },
    [editingApp],
  );

  async function handleSubmit(formData: ApplicationFormValues) {
    const appType = formData.application_type;
    const payload: CreateApplicationSchemaType = {
      ...formData,
      application_type: appType || 'cold_strategic',
      checklist_state: editingApp?.checklist_state ?? {},
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

  async function handleKanbanStatusChange(app: Application, nextStatus: ApplicationStatus) {
    if (app.status === nextStatus) return;

    setOptimisticStatuses((current) => applyOptimisticStatus(current, app.id, nextStatus));
    try {
      await updateApp.mutateAsync({ id: app.id, data: { status: nextStatus } });
    } catch {
      setOptimisticStatuses((current) => rollbackOptimisticStatus(current, app.id));
      toast.error('Status update failed');
    }
  }

  const hasDateFilter = dateFrom || dateTo;

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

  useEffect(() => {
    setOptimisticStatuses((current) => reconcileOptimisticStatuses(current, applications));
  }, [applications]);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />

      <main className="mobile-safe-bottom flex-1 flex flex-col gap-2 p-3 sm:p-4 md:pb-6 overflow-x-hidden overflow-y-auto">
        <p className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>
          Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Search + date range + add */}
        <div className="mobile-filter-scroll sm:flex sm:items-center sm:gap-2 sm:overflow-visible sm:pb-0">
          <div className="relative min-w-56 shrink-0 sm:w-[36rem] lg:w-[40rem]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--ink-4)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Search by company…"
              className="min-h-11 w-full rounded-xl border bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--line)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
            {search && (
              <button type="button" onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--ink-4)' }}>✕</button>
            )}
          </div>

          {/* Date range — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 bg-white border rounded-xl shadow-sm px-3 py-2 shrink-0 text-sm" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ink-4)' }}>Applied</span>
            <input type="date" value={dateFrom} onChange={(e) => handleDateFrom(e.target.value)} className="bg-transparent border-none outline-none text-sm w-32" style={{ color: 'var(--ink-2)' }} />
            <span style={{ color: 'var(--ink-4)' }}>→</span>
            <input type="date" value={dateTo} onChange={(e) => handleDateTo(e.target.value)} className="bg-transparent border-none outline-none text-sm w-32" style={{ color: 'var(--ink-2)' }} />
            {hasDateFilter && (
              <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); resetPage(); }} className="text-sm leading-none" style={{ color: 'var(--ink-4)' }}>×</button>
            )}
          </div>

          <ApplicationsViewToggle view={view} onChange={handleViewChange} />

          <button type="button" onClick={openAdd} className="btn-primary text-sm px-4 py-2 shrink-0 sm:ml-auto">
            + Add
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
            <span>⚠️</span> Failed to load applications. Please refresh.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-2">
            {/* Pagination (top) */}
            {!isKanbanView && !isLoading && totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} total={total} limit={GRID_PAGE_LIMIT} onPageChange={setPage} />
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
            ) : view === 'kanban' ? (
              <ApplicationsKanbanBoard
                applications={visibleApplications}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleKanbanStatusChange}
                deletingId={deletingId}
              />
            ) : isMobile ? (
              <ApplicationCardList
                applications={visibleApplications}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ) : (
              <ApplicationsTable
                applications={visibleApplications}
                sort={sort}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            )}

            {showKanbanLimitHint && (
              <p className="rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
                Showing the first {KANBAN_PAGE_LIMIT} matching applications. Refine filters to narrow the board.
              </p>
            )}

            {/* Pagination (bottom) */}
            {!isKanbanView && !isLoading && totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} total={total} limit={GRID_PAGE_LIMIT} onPageChange={setPage} />
            )}
          </div>

          <ApplicationsRail
            statusCounts={statusCounts}
            activeStatus={statusFilter}
            onStatusClick={handleStatusClick}
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

function ApplicationsViewToggle({
  view,
  onChange,
}: {
  view: ApplicationsView;
  onChange: (view: ApplicationsView) => void;
}) {
  const options: Array<{ value: ApplicationsView; label: string; Icon: typeof Table2 }> = [
    { value: 'grid', label: 'Grid', Icon: Table2 },
    { value: 'kanban', label: 'Kanban', Icon: Columns3 },
  ];

  return (
    <div
      aria-label="Applications view"
      className="inline-flex min-h-11 shrink-0 items-center rounded-xl border bg-white p-1 shadow-sm"
      role="group"
      style={{ borderColor: 'var(--line)' }}
    >
      {options.map(({ value, label, Icon }) => {
        const isActive = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(value)}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition"
            style={{
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'white' : 'var(--ink-3)',
            }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
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
