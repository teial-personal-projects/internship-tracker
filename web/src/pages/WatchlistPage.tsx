import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, ArrowUpDown, Building2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import {
  useCreateWatchlistEntry,
  useDeleteWatchlistEntry,
  usePromoteWatchlistEntry,
  useRefreshWatchlistRadar,
  useUpdateWatchlistEntry,
  useWatchlist,
} from '@/hooks/useWatchlist';
import { formatDate, todayStr } from '@/lib/dateUtils';
import type { WatchlistEntry, WatchlistRadarRefreshResult } from '@/api/watchlist.api';
import type { AtsType, CreateCompanyWatchlistEntrySchemaType, TaskPriority } from '@shared/schemas';

type SortKey = 'added' | 'company_name' | 'priority' | 'target_apply_date';

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string; color: string; rank: number }> = [
  { value: 'high', label: 'High', color: 'var(--accent)', rank: 0 },
  { value: 'medium', label: 'Medium', color: '#A36410', rank: 1 },
  { value: 'low', label: 'Low', color: 'var(--ink-3)', rank: 2 },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'added', label: 'Date added' },
  { value: 'company_name', label: 'Company name' },
  { value: 'priority', label: 'Priority' },
  { value: 'target_apply_date', label: 'Target apply date' },
];

const ATS_OPTIONS: Array<{ value: AtsType; label: string }> = [
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'lever', label: 'Lever' },
  { value: 'ashby', label: 'Ashby' },
  { value: 'smartrecruiters', label: 'SmartRecruiters' },
  { value: 'pinpoint', label: 'Pinpoint' },
  { value: 'welcomekit', label: 'Welcome Kit' },
  { value: 'custom', label: 'Custom careers page' },
];

function priorityMeta(priority: TaskPriority | null | undefined) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority) ?? null;
}

function notesPreview(notes: string | null | undefined): string {
  if (!notes) return 'No notes yet';
  return notes;
}

function compareNullableDate(left: string | null | undefined, right: string | null | undefined) {
  const leftValue = left ?? '9999-12-31';
  const rightValue = right ?? '9999-12-31';
  return leftValue.localeCompare(rightValue);
}

function sortEntries(entries: WatchlistEntry[], sortKey: SortKey): WatchlistEntry[] {
  return [...entries].sort((left, right) => {
    if (sortKey === 'company_name') {
      return left.company_name.localeCompare(right.company_name);
    }

    if (sortKey === 'priority') {
      const leftRank = priorityMeta(left.priority)?.rank ?? 3;
      const rightRank = priorityMeta(right.priority)?.rank ?? 3;
      return leftRank - rightRank || left.company_name.localeCompare(right.company_name);
    }

    if (sortKey === 'target_apply_date') {
      return compareNullableDate(left.target_apply_date, right.target_apply_date)
        || left.company_name.localeCompare(right.company_name);
    }

    return right.added.localeCompare(left.added) || left.company_name.localeCompare(right.company_name);
  });
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Never refreshed';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface WatchlistRowProps {
  entry: WatchlistEntry;
  onEdit: (entry: WatchlistEntry) => void;
  onDelete: (entry: WatchlistEntry) => void;
  onPromote: (entry: WatchlistEntry) => void;
  onRefresh: (entry: WatchlistEntry) => void;
  isDeleting: boolean;
  isPromoting: boolean;
  isRefreshing: boolean;
  refreshResult: WatchlistRadarRefreshResult | undefined;
}

function WatchlistRow({
  entry,
  onEdit,
  onDelete,
  onPromote,
  onRefresh,
  isDeleting,
  isPromoting,
  isRefreshing,
  refreshResult,
}: WatchlistRowProps) {
  const priority = priorityMeta(entry.priority);

  return (
    <div className="grid min-w-[1380px] grid-cols-[minmax(220px,1.4fr)_140px_120px_140px_210px_minmax(220px,1.2fr)_250px] items-center gap-3 border-b px-3 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Building2 size={16} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {entry.company_name}
          </p>
        </div>
        {entry.website && (
          <a
            href={entry.website}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-xs hover:underline"
            style={{ color: 'var(--accent-dark)' }}
          >
            {entry.website}
          </a>
        )}
      </div>

      <span className="w-fit rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
        {entry.industry || 'No industry'}
      </span>

      <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
        <span className="h-2 w-2 rounded-full" style={{ background: priority?.color ?? 'var(--line)' }} />
        {priority?.label ?? 'None'}
      </span>

      <span className="text-sm" style={{ color: 'var(--ink-2)' }}>
        {formatDate(entry.target_apply_date)}
      </span>

      <div className="min-w-0 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.radar_enabled ? 'var(--sage)' : 'var(--line)' }} />
          <span className="font-medium" style={{ color: 'var(--ink-2)' }}>
            {entry.radar_enabled ? 'Radar on' : 'Radar off'}
          </span>
        </div>
        <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
          {refreshResult
            ? `${refreshResult.inserted} new / ${refreshResult.matched} matched`
            : formatDateTime(entry.last_refreshed_at)}
        </p>
      </div>

      <p className="truncate text-sm" style={{ color: entry.notes ? 'var(--ink-2)' : 'var(--ink-3)' }}>
        {notesPreview(entry.notes)}
      </p>

      <div className="flex items-center justify-end gap-1">
        {entry.radar_enabled && (
          <button
            type="button"
            onClick={() => onRefresh(entry)}
            disabled={isRefreshing}
            className="btn-outline flex h-8 items-center gap-1 px-2 text-xs"
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        )}
        <button
          type="button"
          onClick={() => onPromote(entry)}
          disabled={isPromoting}
          className="btn-primary inline-flex h-8 items-center gap-1 px-2 text-xs disabled:opacity-60"
        >
          {isPromoting ? <Spinner size="sm" color="white" /> : <ArrowRight size={14} />}
          Start Application
        </button>
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="btn-outline flex h-8 w-8 items-center justify-center p-0"
          aria-label={`Edit ${entry.company_name}`}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry)}
          disabled={isDeleting}
          className="btn-ghost flex h-8 w-8 items-center justify-center p-0 text-red-600 hover:bg-red-50 disabled:opacity-60"
          aria-label={`Delete ${entry.company_name}`}
        >
          {isDeleting ? <Spinner size="sm" color="red" /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
}

function WatchlistCard({
  entry,
  onEdit,
  onDelete,
  onPromote,
  onRefresh,
  isDeleting,
  isPromoting,
  isRefreshing,
  refreshResult,
}: WatchlistRowProps) {
  const priority = priorityMeta(entry.priority);

  return (
    <article className="rounded-lg border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold" style={{ color: 'var(--ink)' }}>
            {entry.company_name}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
            {entry.industry || 'No industry'}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: priority?.color ?? 'var(--line)' }} />
          {priority?.label ?? 'None'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            Target
          </p>
          <p className="mt-1" style={{ color: 'var(--ink-2)' }}>{formatDate(entry.target_apply_date)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            Added
          </p>
          <p className="mt-1" style={{ color: 'var(--ink-2)' }}>{formatDate(entry.added)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            Radar
          </p>
          <p className="mt-1" style={{ color: 'var(--ink-2)' }}>
            {entry.radar_enabled ? 'Enabled' : 'Not enabled'}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
            {refreshResult
              ? `${refreshResult.inserted} new / ${refreshResult.matched} matched`
              : formatDateTime(entry.last_refreshed_at)}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm" style={{ color: entry.notes ? 'var(--ink-2)' : 'var(--ink-3)' }}>
        {notesPreview(entry.notes)}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        {entry.radar_enabled && (
          <button
            type="button"
            className="btn-outline inline-flex items-center gap-1 text-sm"
            onClick={() => onRefresh(entry)}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        )}
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-1 text-sm"
          onClick={() => onPromote(entry)}
          disabled={isPromoting}
        >
          {isPromoting ? <Spinner size="sm" color="white" /> : <ArrowRight size={14} />}
          Start Application
        </button>
        <button type="button" className="btn-outline text-sm" onClick={() => onEdit(entry)}>
          Edit
        </button>
        <button
          type="button"
          className="btn-ghost text-sm text-red-600 hover:bg-red-50"
          onClick={() => onDelete(entry)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}

interface WatchlistModalProps {
  entry: WatchlistEntry | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCompanyWatchlistEntrySchemaType) => void;
}

function WatchlistModal({ entry, isOpen, isLoading, onClose, onSubmit }: WatchlistModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [targetApplyDate, setTargetApplyDate] = useState('');
  const [added, setAdded] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [atsType, setAtsType] = useState<AtsType | ''>('');
  const [atsBoardToken, setAtsBoardToken] = useState('');
  const [radarEnabled, setRadarEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCompanyName(entry?.company_name ?? '');
    setIndustry(entry?.industry ?? '');
    setWebsite(entry?.website ?? '');
    setPriority(entry?.priority ?? '');
    setTargetApplyDate(entry?.target_apply_date ?? '');
    setAdded(entry?.added ?? todayStr());
    setNotes(entry?.notes ?? '');
    setAtsType(entry?.ats_type ?? '');
    setAtsBoardToken(entry?.ats_board_token ?? '');
    setRadarEnabled(entry?.radar_enabled ?? false);
  }, [entry, isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      company_name: companyName.trim(),
      industry: industry.trim() || null,
      website: website.trim() || null,
      priority: priority || null,
      target_apply_date: targetApplyDate || null,
      added,
      notes: notes.trim() || null,
      ats_type: atsType || null,
      ats_board_token: atsBoardToken.trim() || null,
      radar_enabled: radarEnabled,
    });
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="app-modal-content">
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ background: 'var(--soft)', borderColor: 'var(--line)' }}>
            <Dialog.Title className="text-base font-bold" style={{ color: 'var(--ink)' }}>
              {entry ? 'Edit Company' : 'Add Company'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="rounded p-1 transition-colors hover:bg-black/10">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="field-label">Company Name *</span>
                <input className="field-input" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
              </label>
              <label>
                <span className="field-label">Industry</span>
                <input className="field-input" value={industry} onChange={(event) => setIndustry(event.target.value)} />
              </label>
              <label>
                <span className="field-label">Website</span>
                <input className="field-input" type="url" placeholder="https://" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>
              <label>
                <span className="field-label">Priority</span>
                <select className="field-select" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | '')}>
                  <option value="">Not set</option>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Target Apply Date</span>
                <input className="field-input" type="date" value={targetApplyDate} onChange={(event) => setTargetApplyDate(event.target.value)} />
              </label>
              <label>
                <span className="field-label">Added</span>
                <input className="field-input" type="date" value={added} onChange={(event) => setAdded(event.target.value)} required />
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">Notes</span>
                <textarea className="field-textarea" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
              <div className="sm:col-span-2 rounded-lg border p-4" style={{ borderColor: 'var(--line)', background: 'var(--softer)' }}>
                <label className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      Enable Radar
                    </span>
                    <span className="mt-1 block text-xs" style={{ color: 'var(--ink-3)' }}>
                      Pull matched postings for this company into Discover.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={radarEnabled}
                    onChange={(event) => setRadarEnabled(event.target.checked)}
                    className="h-6 w-6"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="field-label">ATS Type</span>
                    <select
                      className="field-select"
                      value={atsType}
                      onChange={(event) => setAtsType(event.target.value as AtsType | '')}
                    >
                      <option value="">Not set</option>
                      {ATS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label">Board Token</span>
                    <input
                      className="field-input"
                      value={atsBoardToken}
                      onChange={(event) => setAtsBoardToken(event.target.value)}
                      placeholder="company-slug"
                    />
                  </label>
                </div>

                <p className="mt-3 text-xs" style={{ color: 'var(--ink-3)' }}>
                  Use the company careers URL to find the board token. For Greenhouse, it is usually the slug after `boards.greenhouse.io/`; for Lever, it is usually the slug after `jobs.lever.co/`.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4" style={{ borderColor: 'var(--line)' }}>
              <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary text-sm">
                {isLoading ? <Spinner color="white" /> : entry ? 'Save Company' : 'Add Company'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function WatchlistPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [targetFrom, setTargetFrom] = useState('');
  const [targetTo, setTargetTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('added');
  const [editingEntry, setEditingEntry] = useState<WatchlistEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<WatchlistEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshResults, setRefreshResults] = useState<Record<string, WatchlistRadarRefreshResult>>({});

  const params = useMemo(() => ({
    ...(search.trim() && { search: search.trim() }),
    ...(priority && { priority }),
    ...(targetFrom && { target_apply_date_from: targetFrom }),
    ...(targetTo && { target_apply_date_to: targetTo }),
  }), [priority, search, targetFrom, targetTo]);

  const { data: entries = [], isLoading, error } = useWatchlist(params);
  const sortedEntries = useMemo(() => sortEntries(entries, sortKey), [entries, sortKey]);
  const createEntry = useCreateWatchlistEntry();
  const updateEntry = useUpdateWatchlistEntry();
  const deleteEntry = useDeleteWatchlistEntry();
  const promoteEntry = usePromoteWatchlistEntry();
  const refreshRadar = useRefreshWatchlistRadar();

  function openAddModal() {
    setEditingEntry(null);
    setIsModalOpen(true);
  }

  function openEditModal(entry: WatchlistEntry) {
    setEditingEntry(entry);
    setIsModalOpen(true);
  }

  async function handleSubmit(input: CreateCompanyWatchlistEntrySchemaType) {
    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({ id: editingEntry.id, data: input });
        toast.success('Company updated');
      } else {
        await createEntry.mutateAsync(input);
        toast.success('Company added');
      }
      setIsModalOpen(false);
      setEditingEntry(null);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save company'));
    }
  }

  async function handleDelete() {
    if (!confirmDeleteEntry) return;
    setDeletingId(confirmDeleteEntry.id);
    try {
      await deleteEntry.mutateAsync(confirmDeleteEntry.id);
      toast.success('Company deleted');
      setConfirmDeleteEntry(null);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete company'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePromote(entry: WatchlistEntry) {
    setPromotingId(entry.id);
    try {
      await promoteEntry.mutateAsync(entry.id);
      toast.success('Application started');
      navigate('/applications');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not start application'));
    } finally {
      setPromotingId(null);
    }
  }

  async function handleRefresh(entry: WatchlistEntry) {
    setRefreshingId(entry.id);
    try {
      const result = await refreshRadar.mutateAsync(entry.id);
      setRefreshResults((current) => ({ ...current, [entry.id]: result }));
      toast.success(`Radar refreshed: ${result.inserted} new, ${result.matched} matched`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not refresh radar'));
    } finally {
      setRefreshingId(null);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mobile-safe-bottom mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 md:pb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
              Companies To Watch
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
              Track target companies before you are ready to start an application.
            </p>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink-3)' }}>
            {sortedEntries.length} companies
          </span>
          <button type="button" onClick={openAddModal} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={16} />
            Add Company
          </button>
        </div>

        <section className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
          <div className="mobile-filter-scroll lg:grid lg:grid-cols-[minmax(260px,1fr)_160px_180px_180px_190px] lg:overflow-visible lg:pb-0">
            <label className="relative block min-w-64 lg:min-w-0">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies..."
                className="field-input w-full pl-9"
              />
            </label>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="field-select min-w-40 lg:w-full"
              aria-label="Priority filter"
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={targetFrom}
              onChange={(event) => setTargetFrom(event.target.value)}
              className="field-input min-w-44 lg:w-full"
              aria-label="Target apply date from"
            />

            <input
              type="date"
              value={targetTo}
              onChange={(event) => setTargetTo(event.target.value)}
              className="field-input min-w-44 lg:w-full"
              aria-label="Target apply date to"
            />

            <label className="relative block min-w-48 lg:min-w-0">
              <ArrowUpDown size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }} />
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="field-select w-full pl-9"
                aria-label="Sort companies"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load companies. Please refresh.
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : sortedEntries.length === 0 ? (
          <section className="rounded-lg border bg-white px-4 py-12 text-center" style={{ borderColor: 'var(--line)' }}>
            <Building2 size={30} className="mx-auto" strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
            <h2 className="mt-3 text-base font-semibold" style={{ color: 'var(--ink)' }}>
              No companies found
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: 'var(--ink-3)' }}>
              Build a target list for companies you want to research, track, and promote into applications later.
            </p>
            <button type="button" onClick={openAddModal} className="btn-primary mt-5 inline-flex items-center gap-2 text-sm">
              <Plus size={16} />
              Add a Company
            </button>
          </section>
        ) : (
          <>
            <section className="hidden overflow-x-auto rounded-lg border bg-white md:block" style={{ borderColor: 'var(--line)' }}>
              <div className="grid min-w-[1380px] grid-cols-[minmax(220px,1.4fr)_140px_120px_140px_210px_minmax(220px,1.2fr)_250px] gap-3 border-b px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
                <span>Company</span>
                <span>Industry</span>
                <span>Priority</span>
                <span>Target</span>
                <span>Radar</span>
                <span>Notes</span>
                <span className="text-right">Actions</span>
              </div>
              {sortedEntries.map((entry) => (
                <WatchlistRow
                  key={entry.id}
                  entry={entry}
                  onEdit={openEditModal}
                  onDelete={setConfirmDeleteEntry}
                  onPromote={handlePromote}
                  onRefresh={handleRefresh}
                  isDeleting={deletingId === entry.id}
                  isPromoting={promotingId === entry.id}
                  isRefreshing={refreshingId === entry.id}
                  refreshResult={refreshResults[entry.id]}
                />
              ))}
            </section>

            <section className="grid gap-3 md:hidden">
              {sortedEntries.map((entry) => (
                <WatchlistCard
                  key={entry.id}
                  entry={entry}
                  onEdit={openEditModal}
                  onDelete={setConfirmDeleteEntry}
                  onPromote={handlePromote}
                  onRefresh={handleRefresh}
                  isDeleting={deletingId === entry.id}
                  isPromoting={promotingId === entry.id}
                  isRefreshing={refreshingId === entry.id}
                  refreshResult={refreshResults[entry.id]}
                />
              ))}
            </section>
          </>
        )}
      </main>

      <WatchlistModal
        entry={editingEntry}
        isOpen={isModalOpen}
        isLoading={createEntry.isPending || updateEntry.isPending}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog.Root open={Boolean(confirmDeleteEntry)} onOpenChange={(open) => { if (!open) setConfirmDeleteEntry(null); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <AlertDialog.Content className="app-confirm-content">
            <AlertDialog.Title className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              Delete company?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm" style={{ color: 'var(--ink-3)' }}>
              This removes {confirmDeleteEntry?.company_name ?? 'this company'} from Companies To Watch.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button type="button" className="btn-outline text-sm">Cancel</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={Boolean(deletingId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId ? 'Deleting...' : 'Delete'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
