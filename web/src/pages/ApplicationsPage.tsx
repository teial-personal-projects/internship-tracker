import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Application, CreateApplicationSchemaType } from '@shared/schemas';
import { useApplications, useApplicationStats, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/useApplications';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import { Pagination } from '@/components/Pagination';
import { PipelineBar } from '@/components/PipelineBar';
import { ApplicationsTable } from '@/components/ApplicationsTable';
import { ApplicationCardList } from '@/components/ApplicationCardList';
import { ApplicationModal, type ApplicationFormValues } from '@/components/ApplicationModal';
import { UrgentTasksWidget } from '@/components/UrgentTasksWidget';
import { todayStr } from '@/lib/dateUtils';

const PAGE_LIMIT = 25;
const TODAY = todayStr();

export function ApplicationsPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryParams = useMemo(() => ({
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { application_type: typeFilter }),
    ...(search.trim() && { search: search.trim() }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    page,
    limit: PAGE_LIMIT,
  }), [statusFilter, typeFilter, search, dateFrom, dateTo, page]);

  const { data, isLoading, error } = useApplications(queryParams);
  const { data: stats } = useApplicationStats();

  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();

  const applications = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const statusCounts = stats?.status_counts ?? {};

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
    setStatusFilter(status);
    resetPage();
  }

  function handleSearch(q: string) { setSearch(q); resetPage(); }
  function handleTypeFilter(t: string) { setTypeFilter(t); resetPage(); }
  function handleDateFrom(d: string) { setDateFrom(d); resetPage(); }
  function handleDateTo(d: string) { setDateTo(d); resetPage(); }

  const modalDefaultValues = useMemo(
    () => editingApp ?? { added: TODAY },
    [editingApp],
  );

  async function handleSubmit(formData: ApplicationFormValues) {
    const appType = formData.application_type;
    const payload: CreateApplicationSchemaType = {
      ...formData,
      application_type: appType === '' ? null : appType,
      checklist_state: editingApp?.checklist_state ?? {},
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

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />

      <main className="flex-1 flex flex-col gap-2 p-3 sm:p-4 pb-20 md:pb-6 overflow-x-hidden overflow-y-auto">
        <p className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>
          Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Search + date range + add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 min-w-40">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--ink-4)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Search by company…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border bg-white shadow-sm focus:outline-none focus:ring-2"
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

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="hidden sm:block text-sm border rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-2)' }}
          >
            <option value="">All Types</option>
            <option value="cold_strategic">Cold</option>
            <option value="recruiter_assisted">Recruiter</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>

          <button type="button" onClick={openAdd} className="btn-primary text-sm px-4 py-2 shrink-0">
            + Add
          </button>
        </div>

        {/* Pipeline bar */}
        {Object.keys(statusCounts).length > 0 && (
          <PipelineBar
            statusCounts={statusCounts}
            activeStatus={statusFilter}
            onStatusClick={handleStatusClick}
          />
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
            <span>⚠️</span> Failed to load applications. Please refresh.
          </div>
        )}

        {/* Pagination (top) */}
        {!isLoading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_LIMIT} onPageChange={setPage} />
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : isMobile ? (
          <ApplicationCardList applications={applications} onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId} />
        ) : (
          <ApplicationsTable applications={applications} onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId} />
        )}

        {/* Pagination (bottom) */}
        {!isLoading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_LIMIT} onPageChange={setPage} />
        )}

        {/* Urgent tasks widget */}
        <UrgentTasksWidget />
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
