import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { todayStr, isDeadlineSoon, isStaleJob } from '@/lib/dateUtils';
import type { Job, QuickFilter, CreateJobInput } from '@shared/types';
import { MIN_YEAR_RANK } from '@shared/types';
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob, useMarkApplied } from '@/hooks/useJobs';
import { useProfile } from '@/hooks/useProfile';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Spinner } from '@/components/Spinner';
import { AlertBar } from '@/components/AlertBar';
import { FilterBar } from '@/components/FilterBar';
import { JobsTable } from '@/components/JobsTable';
import { JobCardList } from '@/components/JobCardList';
import { JobModal } from '@/components/JobModal';
import { UserMenu } from '@/components/UserMenu';
import { AppHeader } from '@/components/AppHeader';

const TODAY = todayStr();
const now = new Date();
// Academic year starts August 1 — if before August, we're still in last year's cycle
const CURRENT_ACAD_YEAR = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
const PAGE_SIZE = 15;

// ── Empty state placeholder ───────────────────────────────────────────────

function TablePlaceholder({ onAdd }: { onAdd: () => void }) {
  const cols = ['Company', 'Title', 'Location', 'Added', 'Deadline', 'Status', 'Actions'];
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* fake header row */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-brand-50">
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-4 py-3 text-left text-xs font-semibold text-brand-700 tracking-wider uppercase border-b-2 border-brand-200 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {cols.map((c) => (
                  <td key={c} className="px-4 py-3">
                    <div
                      className="animate-pulse bg-gray-200 rounded h-3.5"
                      style={{ width: c === 'Actions' ? '80px' : c === 'Status' ? '70px' : `${60 + Math.random() * 40}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* overlay CTA */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-xl">
        <span className="text-3xl">💼</span>
        <p className="font-semibold text-gray-700">No jobs yet</p>
        <p className="text-sm text-gray-500 text-center max-w-65">
          Add your first job to start tracking applications and deadlines.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="btn-primary text-sm"
        >
          + Add your first job
        </button>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────

export function DashboardPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateField, setDateField] = useState<'applied_date' | 'added' | 'deadline'>('added');
  const [isOpen, setIsOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const modalDefaultValues = useMemo(
    () => editingJob ?? { added: TODAY },
    [editingJob],
  );
  const [year, setYear] = useState(CURRENT_ACAD_YEAR);
  const [page, setPage] = useState(1);

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hideAboveClass, setHideAboveClass] = useState(false);

  const { data: jobs = [], isLoading, error } = useJobs(year);
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!isLoading && jobs.length > 0) {
      const hasInProgress = jobs.some((j) => j.status === 'in_progress');
      setQuickFilter(hasInProgress ? 'in_progress' : 'not_started');
    }
  }, [isLoading]);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const markApplied = useMarkApplied();

  const filteredJobs = (() => {
    let result = applyFilter(jobs, quickFilter);
    if (hideAboveClass && profile?.current_class) {
      const myRank = MIN_YEAR_RANK[profile.current_class];
      result = result.filter((j) => !j.min_year || MIN_YEAR_RANK[j.min_year] <= myRank);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((j) => j.company.toLowerCase().includes(q));
    }
    if (dateFrom) {
      result = result.filter((j) => !!j[dateField] && (j[dateField] as string) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((j) => !!j[dateField] && (j[dateField] as string) <= dateTo);
    }
    return result;
  })();
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const pagedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasDateFilter = dateFrom || dateTo;

  function handleQuickFilter(qf: QuickFilter) { setQuickFilter(qf); setPage(1); }
  function handleYear(y: number) { setYear(y); setPage(1); }
  function handleSearch(q: string) { setSearch(q); setPage(1); }
  function clearDates() { setDateFrom(''); setDateTo(''); setPage(1); }
  function handleDateField(f: typeof dateField) { setDateField(f); setDateFrom(''); setDateTo(''); setPage(1); }

  function sortWithInProgressFirst(jobs: Job[]): Job[] {
    return [...jobs].sort((a, b) => {
      const aip = a.status === 'in_progress' ? 0 : 1;
      const bip = b.status === 'in_progress' ? 0 : 1;
      return aip - bip;
    });
  }

  function applyFilter(jobs: Job[], qf: QuickFilter): Job[] {
    if (qf === 'in_progress') return jobs.filter((j) => j.status === 'in_progress');
    if (qf === 'not_started') return jobs.filter((j) => j.status === 'not_started');
    if (qf === 'applied') return jobs.filter((j) => !!j.applied_date);
    if (qf === 'rejected') return jobs.filter((j) => j.status === 'rejected');
    if (qf === 'conference') return jobs.filter((j) => !!j.conference);
    if (qf === 'due_soon') return jobs.filter(
      (j) => !['applied', 'archive'].includes(j.status) && isDeadlineSoon(j.deadline)
    );
    if (qf === 'stale') return jobs.filter((j) => isStaleJob(j.added, j.status));
    if (qf === 'archived') return jobs.filter((j) => j.status === 'archive');
    return sortWithInProgressFirst(jobs); // 'all' — in_progress floats to top
  }

  async function handleSubmit(formData: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      if (editingJob) {
        await updateJob.mutateAsync({ id: editingJob.id, data: formData });
        toast.success('Job updated');
      } else {
        await createJob.mutateAsync(formData as CreateJobInput);
        toast.success('Job added');
      }
      setEditingJob(null);
      setIsOpen(false);
    } catch {
      toast.error('Something went wrong');
    }
  }

  function handleEdit(job: Job) { setEditingJob(job); setIsOpen(true); }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deleteJob.mutateAsync(id); toast.success('Job deleted'); }
    catch { toast.error('Delete failed'); }
    finally { setDeletingId(null); }
  }

  async function handleMarkApplied(id: string) {
    setApplyingId(id);
    try { await markApplied.mutateAsync(id); toast.success('Marked as applied'); }
    catch { toast.error('Update failed'); }
    finally { setApplyingId(null); }
  }

  function openAdd() { setEditingJob(null); setIsOpen(true); }

  return (
    <div className="flex h-screen flex-col bg-[#F5F5F3] overflow-hidden">

      {/* Header */}
      <AppHeader>
        <UserMenu />
      </AppHeader>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-2 p-3 sm:p-4 pb-6 overflow-hidden">

        {/* Today date */}
        <p className="text-xs text-gray-500 font-medium">
          Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Alert bar */}
        {!isLoading && <AlertBar jobs={jobs} />}

        {/* Search + date range + add button */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Search by company…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {search && (
              <button type="button" onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Date range — single pill */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 shrink-0">
            <select
              value={dateField}
              onChange={(e) => handleDateField(e.target.value as typeof dateField)}
              className="text-[10px] font-bold tracking-widest text-gray-400 uppercase bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="added">Added</option>
              <option value="deadline">Deadline</option>
              <option value="applied_date">Applied</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="text-sm bg-transparent border-none outline-none text-gray-700 w-32"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="text-sm bg-transparent border-none outline-none text-gray-700 w-32"
            />
            {hasDateFilter && (
              <button type="button" onClick={clearDates} className="text-gray-400 hover:text-gray-600 text-sm leading-none">×</button>
            )}
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="btn-primary text-sm px-4 py-2 shrink-0"
          >
            + Add
          </button>
        </div>

        {/* Filter bar + year selector + class filter toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar quickFilter={quickFilter} onQuickFilter={handleQuickFilter} jobs={jobs} />
          <select
            value={year}
            onChange={(e) => handleYear(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 shrink-0"
          >
            {[CURRENT_ACAD_YEAR + 1, CURRENT_ACAD_YEAR, CURRENT_ACAD_YEAR - 1, CURRENT_ACAD_YEAR - 2].map((y, i) => (
              <option key={y} value={y}>{i === 0 ? `Future (${y}–${y + 1})` : `${y}–${y + 1}`}</option>
            ))}
          </select>
          {profile?.current_class && (
            <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={hideAboveClass}
                onChange={(e) => setHideAboveClass(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Hide above my class
            </label>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span>⚠️</span>
            Failed to load jobs. Please refresh.
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredJobs.length > PAGE_SIZE && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {filteredJobs.length} jobs · Page <span className="text-brand-700 font-semibold">{page}</span> of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-brand-300 text-brand-700 bg-white hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-brand-300 text-brand-700 bg-white hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Table or card list or spinner or placeholder */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="relative">
            <TablePlaceholder onAdd={openAdd} />
          </div>
        ) : isMobile ? (
          <div className="flex-1 overflow-y-auto">
            <JobCardList
              jobs={pagedJobs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkApplied={handleMarkApplied}
              applyingId={applyingId}
              deletingId={deletingId}
            />
          </div>
        ) : (
          <JobsTable
            jobs={pagedJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkApplied={handleMarkApplied}
            applyingId={applyingId}
            deletingId={deletingId}
          />
        )}
      </main>

      {/* Add/Edit Modal */}
      <JobModal
        isOpen={isOpen}
        onClose={() => { setEditingJob(null); setIsOpen(false); }}
        onSubmit={handleSubmit}
        isLoading={createJob.isPending || updateJob.isPending}
        defaultValues={modalDefaultValues}
        title={editingJob ? 'Edit Job' : 'Add Job'}
      />
    </div>
  );
}
