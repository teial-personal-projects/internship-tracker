import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import { useRadarPostings, usePromoteRadarPosting, useUpdateRadarPostingStatus } from '@/hooks/useRadar';
import { useWatchlist } from '@/hooks/useWatchlist';
import { formatDate } from '@/lib/dateUtils';
import { isAxiosError } from 'axios';
import { ArrowRight, Building2, CalendarDays, ExternalLink, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { WatchlistWorkspace } from '@/pages/WatchlistPage';
import type { DiscoveredPosting, PostingStatus } from '@shared/schemas';

type StatusFilter = Extract<PostingStatus, 'new' | 'seen' | 'dismissed' | 'promoted'>;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'seen', label: 'Seen' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'promoted', label: 'Added' },
];

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}

function formatIsoDate(value: string | null | undefined, empty = 'Not listed'): string {
  if (!value) return empty;
  return formatDate(value.slice(0, 10), empty);
}

function remoteLabel(posting: DiscoveredPosting): string {
  const remoteStatus = posting.remote_status?.trim();
  if (remoteStatus) return remoteStatus;
  return posting.location?.toLowerCase().includes('remote') ? 'Remote' : 'Remote unknown';
}

function groupByCompany(postings: DiscoveredPosting[]) {
  const groups = new Map<string, DiscoveredPosting[]>();

  for (const posting of postings) {
    const companyPostings = groups.get(posting.company_name) ?? [];
    companyPostings.push(posting);
    groups.set(posting.company_name, companyPostings);
  }

  return [...groups.entries()]
    .map(([company, companyPostings]) => ({
      company,
      postings: companyPostings.sort((left, right) => right.first_seen_at.localeCompare(left.first_seen_at)),
    }))
    .sort((left, right) => right.postings[0].first_seen_at.localeCompare(left.postings[0].first_seen_at));
}

interface PostingCardProps {
  posting: DiscoveredPosting;
  onPromote: (posting: DiscoveredPosting) => void;
  onDismiss: (posting: DiscoveredPosting) => void;
  isPromoting: boolean;
  isDismissing: boolean;
}

function PostingCard({ posting, onPromote, onDismiss, isPromoting, isDismissing }: PostingCardProps) {
  const canAct = posting.status !== 'dismissed' && posting.status !== 'promoted';

  return (
    <article className="rounded-lg border bg-white p-4 shadow-sm" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {posting.status === 'new' && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--accent-tint)', color: 'var(--accent-dark)' }}>
                New
              </span>
            )}
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--sage-tint)', color: 'var(--sage)' }}>
              {remoteLabel(posting)}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
            {posting.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--ink-3)' }}>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} />
              Posted {formatIsoDate(posting.posted_at)}
            </span>
            <span>First seen {formatIsoDate(posting.first_seen_at)}</span>
            {posting.location && <span>{posting.location}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <a
            href={posting.url}
            target="_blank"
            rel="noreferrer"
            className="btn-outline inline-flex min-h-11 items-center gap-1 px-3 text-sm"
          >
            <ExternalLink size={15} />
            Open
          </a>
          {canAct && (
            <>
              <button
                type="button"
                className="btn-primary inline-flex min-h-11 items-center gap-1 px-3 text-sm"
                onClick={() => onPromote(posting)}
                disabled={isPromoting}
              >
                {isPromoting ? <Spinner size="sm" color="white" /> : <ArrowRight size={15} />}
                Add to tracker
              </button>
              <button
                type="button"
                className="btn-ghost min-h-11 px-3 text-sm"
                onClick={() => onDismiss(posting)}
                disabled={isDismissing}
                style={{ color: 'var(--ink-3)' }}
              >
                {isDismissing ? <Spinner size="sm" /> : 'Dismiss'}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function RadarPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusFilter>('new');
  const [watchlistId, setWatchlistId] = useState('');
  const [search, setSearch] = useState('');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const queryParams = useMemo(() => ({
    status,
    ...(watchlistId && { watchlist_id: watchlistId }),
    ...(search.trim() && { search: search.trim() }),
  }), [search, status, watchlistId]);

  const { data: postings = [], isLoading, error } = useRadarPostings(queryParams);
  const { data: watchlist = [] } = useWatchlist();
  const promotePosting = usePromoteRadarPosting();
  const updatePostingStatus = useUpdateRadarPostingStatus();

  const companyGroups = useMemo(() => groupByCompany(postings), [postings]);

  async function handlePromote(posting: DiscoveredPosting) {
    setPromotingId(posting.id);
    try {
      const result = await promotePosting.mutateAsync(posting.id);
      toast.success('Application added to tracker');
      navigate(`/applications?application_id=${result.application_id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add posting to tracker'));
    } finally {
      setPromotingId(null);
    }
  }

  async function handleDismiss(posting: DiscoveredPosting) {
    setDismissingId(posting.id);
    try {
      await updatePostingStatus.mutateAsync({ id: posting.id, status: 'dismissed' });
      toast.success('Posting dismissed');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not dismiss posting'));
    } finally {
      setDismissingId(null);
    }
  }

  const hasFilters = status !== 'new' || watchlistId || search.trim();

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mobile-safe-bottom flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Discover Workspace
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
            Manage watched companies and review matched roles from their careers pages.
          </p>
        </div>

        <section className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--soft)' }}>
              <Building2 size={18} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Watched companies
              </h2>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--ink-3)' }}>
                Add target companies and connect their careers source.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--soft)' }}>
              <RefreshCw size={18} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Source refresh
              </h2>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--ink-3)' }}>
                Refresh company sources manually now; stale-source auto-refresh comes next.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--soft)' }}>
              <Search size={18} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Matched roles
              </h2>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--ink-3)' }}>
                Review discovered postings and add strong matches to Applications.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <WatchlistWorkspace embedded autoRefreshStaleSources />
        </section>

        <div className="flex flex-col gap-1 pt-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
            Discovered Postings
          </h2>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
            Matched roles from watched companies, grouped by company with newest matches first.
          </p>
        </div>

        <section className="rounded-lg border bg-white p-3 shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <div className="mobile-filter-scroll md:grid md:grid-cols-[180px_minmax(180px,240px)_1fr_auto] md:items-center md:overflow-visible md:pb-0">
            <label className="min-w-36 md:min-w-0">
              <span className="field-label">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="field-select"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="min-w-48 md:min-w-0">
              <span className="field-label">Company</span>
              <select
                value={watchlistId}
                onChange={(event) => setWatchlistId(event.target.value)}
                className="field-select"
              >
                <option value="">All companies</option>
                {watchlist.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.company_name}</option>
                ))}
              </select>
            </label>

            <label className="min-w-64 md:min-w-0">
              <span className="field-label">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--ink-4)' }} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search titles..."
                  className="field-input pl-9"
                />
              </span>
            </label>

            {hasFilters && (
              <button
                type="button"
                className="btn-outline mt-5 inline-flex min-h-11 items-center gap-1 px-3 text-sm"
                onClick={() => {
                  setStatus('new');
                  setWatchlistId('');
                  setSearch('');
                }}
              >
                <X size={15} />
                Reset
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-lg border p-3 text-sm" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>
            Failed to load matched postings. Please refresh.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : companyGroups.length > 0 ? (
          <div className="flex flex-col gap-5">
            {companyGroups.map((group) => (
              <section key={group.company} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <Building2 size={17} style={{ color: 'var(--ink-3)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                    {group.company}
                  </h2>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
                    {group.postings.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.postings.map((posting) => (
                    <PostingCard
                      key={posting.id}
                      posting={posting}
                      onPromote={handlePromote}
                      onDismiss={handleDismiss}
                      isPromoting={promotingId === posting.id}
                      isDismissing={dismissingId === posting.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-lg border bg-white p-6 shadow-sm" style={{ borderColor: 'var(--line)' }}>
            <div className="flex max-w-2xl items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--soft)' }}>
                {hasFilters ? (
                  <SlidersHorizontal size={22} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
                ) : (
                  <RefreshCw size={22} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                  {hasFilters ? 'No postings match these filters' : 'No matched postings yet'}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
                  Add a watched company, connect its careers source, then refresh that source to pull matching roles into this workspace.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
