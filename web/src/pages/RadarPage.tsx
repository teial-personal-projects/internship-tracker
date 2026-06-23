import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Building2, CheckCircle2, ChevronDown, ExternalLink, Eye, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import { useCreateWatchlistEntry, useWatchlist } from '@/hooks/useWatchlist';
import { useRadarPostings, useUpdateRadarPostingStatus } from '@/hooks/useRadar';
import { WatchlistWorkspace } from '@/pages/WatchlistPage';
import type { WatchlistEntry } from '@/api/watchlist.api';
import type {
  DiscoveredPosting,
  PostingStatus,
  PostingValidityStatus,
  SourceTier,
} from '@shared/schemas';

type StatusFilter = Extract<PostingStatus, 'new' | 'seen' | 'dismissed'>;
type DiscoveryView = 'fresh_direct' | 'curated' | 'aggregator' | 'live_only' | 'all';
type RadarPostingView = DiscoveredPosting;
type ProvenanceSource = { sourceName?: string; source_name?: string; name?: string };

interface CompanyGroup {
  company: string;
  watchlistEntry: WatchlistEntry | undefined;
  postings: RadarPostingView[];
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'seen', label: 'Seen' },
  { value: 'dismissed', label: 'Dismissed' },
];

const VIEW_OPTIONS: Array<{ value: DiscoveryView; label: string }> = [
  { value: 'fresh_direct', label: 'Fresh direct matches' },
  { value: 'curated', label: 'Curated' },
  { value: 'aggregator', label: 'Aggregator' },
  { value: 'live_only', label: 'Live only' },
  { value: 'all', label: 'All' },
];

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.round(diffMs / 3_600_000));
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays}d ago`;
}

function sourceTier(posting: RadarPostingView): SourceTier {
  return posting.source_tier ?? 'direct_ats';
}

function sourceTierLabel(tier: SourceTier): string {
  if (tier === 'curated_board') return 'Curated';
  if (tier === 'aggregator') return 'Aggregator';
  return 'Direct ATS';
}

function sourceName(posting: RadarPostingView, entry: WatchlistEntry | undefined): string {
  if (posting.first_seen_source && posting.first_seen_source !== 'radar') {
    return posting.first_seen_source;
  }

  if (entry?.ats_type) {
    return entry.ats_type
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return 'Radar';
}

function validityStatus(posting: RadarPostingView): PostingValidityStatus {
  return posting.validity_status ?? 'unchecked';
}

function validityLabel(status: PostingValidityStatus): string {
  if (status === 'not_found') return 'Not found';
  if (status === 'error') return 'Validation failed';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function validityColor(status: PostingValidityStatus): string {
  if (status === 'live') return '#15803D';
  if (status === 'closed' || status === 'not_found') return '#B91C1C';
  if (status === 'error') return '#A36410';
  return '#7C5E10';
}

function alsoSeenOn(posting: RadarPostingView): string[] {
  if (!Array.isArray(posting.also_seen_on)) return [];

  return posting.also_seen_on
    .map((source) => {
      if (typeof source === 'string') return source;
      if (!source || typeof source !== 'object') return '';

      const provenanceSource = source as ProvenanceSource;
      return provenanceSource.sourceName ?? provenanceSource.source_name ?? provenanceSource.name ?? '';
    })
    .filter(Boolean);
}

function isFreshMatch(posting: RadarPostingView): boolean {
  const status = validityStatus(posting);
  return sourceTier(posting) === 'direct_ats' && status !== 'closed' && status !== 'not_found';
}

function postingMatchesView(posting: RadarPostingView, view: DiscoveryView): boolean {
  const tier = sourceTier(posting);
  const validity = validityStatus(posting);

  if (view === 'fresh_direct') return isFreshMatch(posting);
  if (view === 'curated') return tier === 'curated_board';
  if (view === 'aggregator') return tier === 'aggregator';
  if (view === 'live_only') return validity === 'live';
  return true;
}

function groupByCompany(
  postings: RadarPostingView[],
  watchlist: WatchlistEntry[],
): CompanyGroup[] {
  const watchlistById = new Map(watchlist.map((entry) => [entry.id, entry]));
  const groups = new Map<string, RadarPostingView[]>();

  for (const posting of postings) {
    const companyPostings = groups.get(posting.company_name) ?? [];
    companyPostings.push(posting);
    groups.set(posting.company_name, companyPostings);
  }

  return [...groups.entries()]
    .map(([company, companyPostings]) => {
      const sortedPostings = companyPostings.sort((left, right) => right.first_seen_at.localeCompare(left.first_seen_at));
      return {
        company,
        postings: sortedPostings,
        watchlistEntry: watchlistById.get(sortedPostings[0]?.watchlist_id ?? ''),
      };
    })
    .sort((left, right) => right.postings[0].first_seen_at.localeCompare(left.postings[0].first_seen_at));
}

function companyInitials(company: string): string {
  const words = company.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'CO';
}

interface PostingRowProps {
  posting: RadarPostingView;
  watchlistEntry: WatchlistEntry | undefined;
  isSaved: boolean;
  isSaving: boolean;
  onSaveCompany: (posting: RadarPostingView) => void;
  onMarkSeen: (posting: RadarPostingView) => void;
}

function PostingRow({
  posting,
  watchlistEntry,
  isSaved,
  isSaving,
  onSaveCompany,
  onMarkSeen,
}: PostingRowProps) {
  const status = validityStatus(posting);
  const tier = sourceTier(posting);
  const seenSources = alsoSeenOn(posting);
  const source = sourceName(posting, watchlistEntry);
  const relativeFirstSeen = formatRelativeTime(posting.first_seen_at);
  const canSave = !isSaved && !isSaving;

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0">
        <a
          href={posting.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => { if (posting.status === 'new') onMarkSeen(posting); }}
          className="inline-flex max-w-full items-center gap-1 text-sm font-semibold hover:underline"
          style={{ color: 'var(--ink)' }}
        >
          <span className="truncate">{posting.title}</span>
          <ExternalLink size={13} className="shrink-0" />
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--ink-3)' }}>
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: 'var(--sage-tint)', color: 'var(--sage)' }}>
            {sourceTierLabel(tier)}
          </span>
          <span className="inline-flex items-center gap-1" style={{ color: validityColor(status) }}>
            <CheckCircle2 size={12} />
            {validityLabel(status)}
          </span>
          <span>First seen from {source}</span>
          {relativeFirstSeen && <span>{relativeFirstSeen}</span>}
          {seenSources.map((seenSource) => (
            <span key={seenSource} className="inline-flex items-center gap-1">
              <Eye size={12} />
              Also seen on {seenSource}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={isSaved ? 'btn-outline min-h-9 px-3 text-sm' : 'btn-primary min-h-9 px-3 text-sm'}
        onClick={() => onSaveCompany(posting)}
        disabled={!canSave}
      >
        {isSaving ? <Spinner size="sm" color="white" /> : isSaved ? 'Saved company' : 'Save company'}
      </button>
    </div>
  );
}

interface CompanyRadarCardProps {
  group: CompanyGroup;
  savedCompanyNames: Set<string>;
  savingCompanyName: string | null;
  onSaveCompany: (posting: RadarPostingView) => void;
  onMarkSeen: (posting: RadarPostingView) => void;
}

function CompanyRadarCard({
  group,
  savedCompanyNames,
  savingCompanyName,
  onSaveCompany,
  onMarkSeen,
}: CompanyRadarCardProps) {
  const freshDirectCount = group.postings.filter(isFreshMatch).length;
  const closedCount = group.postings.filter((posting) => {
    const status = validityStatus(posting);
    return status === 'closed' || status === 'not_found';
  }).length;
  const primarySource = sourceName(group.postings[0], group.watchlistEntry);
  const subtitleParts = [primarySource, group.watchlistEntry?.industry].filter(Boolean);

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: 'var(--soft)' }}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: 'var(--sage-tint)', color: 'var(--sage)' }}>
            {companyInitials(group.company)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {group.company}
            </h2>
            <p className="truncate text-xs" style={{ color: 'var(--ink-3)' }}>
              {subtitleParts.join(' · ') || 'Company source'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {freshDirectCount > 0 && (
            <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ background: 'var(--sage-tint)', color: 'var(--sage)' }}>
              {freshDirectCount} fresh direct
            </span>
          )}
          {closedCount > 0 && (
            <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
              {closedCount} closed
            </span>
          )}
          <ChevronDown size={16} style={{ color: 'var(--ink-3)' }} />
        </div>
      </div>

      <div>
        {group.postings.map((posting) => (
          <PostingRow
            key={posting.id}
            posting={posting}
            watchlistEntry={group.watchlistEntry}
            isSaved={savedCompanyNames.has(posting.company_name.toLowerCase())}
            isSaving={savingCompanyName === posting.company_name.toLowerCase()}
            onSaveCompany={onSaveCompany}
            onMarkSeen={onMarkSeen}
          />
        ))}
      </div>
    </section>
  );
}

export function RadarPage() {
  const [status, setStatus] = useState<StatusFilter>('new');
  const [watchlistId, setWatchlistId] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<DiscoveryView>('fresh_direct');
  const [savingCompanyName, setSavingCompanyName] = useState<string | null>(null);

  const queryParams = useMemo(() => ({
    ...(status && { status }),
    ...(watchlistId && { watchlist_id: watchlistId }),
    ...(search.trim() && { search: search.trim() }),
  }), [search, status, watchlistId]);

  const { data: postings = [], isLoading, error } = useRadarPostings(queryParams);
  const { data: watchlist = [] } = useWatchlist();
  const createWatchlistEntry = useCreateWatchlistEntry();
  const updatePostingStatus = useUpdateRadarPostingStatus();

  const savedCompanyNames = useMemo(
    () => new Set(watchlist.map((entry) => entry.company_name.toLowerCase())),
    [watchlist],
  );

  const filteredPostings = useMemo(() => (
    (postings as RadarPostingView[]).filter((posting) => postingMatchesView(posting, view))
  ), [postings, view]);

  const companyGroups = useMemo(() => groupByCompany(filteredPostings, watchlist), [filteredPostings, watchlist]);

  const metrics = useMemo(() => {
    const viewPostings = postings as RadarPostingView[];
    const newToday = viewPostings.filter((posting) => posting.status === 'new').length;
    const directAts = viewPostings.filter((posting) => sourceTier(posting) === 'direct_ats').length;
    const live = viewPostings.filter((posting) => validityStatus(posting) === 'live').length;
    const closed = viewPostings.filter((posting) => {
      const postingValidity = validityStatus(posting);
      return postingValidity === 'closed' || postingValidity === 'not_found';
    }).length;

    return { newToday, directAts, live, closed };
  }, [postings]);

  async function handleSaveCompany(posting: RadarPostingView) {
    const normalizedCompanyName = posting.company_name.toLowerCase();
    if (savedCompanyNames.has(normalizedCompanyName)) return;

    setSavingCompanyName(normalizedCompanyName);
    try {
      await createWatchlistEntry.mutateAsync({
        company_name: posting.company_name,
        added: new Date().toISOString().slice(0, 10),
        radar_enabled: false,
      });
      toast.success('Company saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save company'));
    } finally {
      setSavingCompanyName(null);
    }
  }

  async function handleMarkSeen(posting: RadarPostingView) {
    if (posting.status !== 'new') return;

    try {
      await updatePostingStatus.mutateAsync({ id: posting.id, status: 'seen' });
    } catch {
      // Opening the source posting should not be blocked by status bookkeeping.
    }
  }

  const hasFilters = status !== 'new' || watchlistId || search.trim() || view !== 'fresh_direct';

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mobile-safe-bottom flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:pb-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Discover & Watchlist
          </h1>
          <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
            Open roles, save companies.
          </span>
        </div>

        <section className="rounded-lg border bg-white p-3 shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <WatchlistWorkspace embedded />
        </section>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={18} style={{ color: 'var(--ink-3)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              Radar by company
            </h2>
          </div>
          <select
            value={view}
            onChange={(event) => setView(event.target.value as DiscoveryView)}
            className="field-select min-w-52 md:w-auto"
            aria-label="Radar view"
          >
            {VIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>New</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{metrics.newToday}</p>
          </div>
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Direct ATS</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{metrics.directAts}</p>
          </div>
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Live</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{metrics.live}</p>
          </div>
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Closed</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{metrics.closed}</p>
          </div>
        </section>

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
                  setView('fresh_direct');
                }}
              >
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
          <div className="flex flex-col gap-3">
            {companyGroups.map((group) => (
              <CompanyRadarCard
                key={group.company}
                group={group}
                savedCompanyNames={savedCompanyNames}
                savingCompanyName={savingCompanyName}
                onSaveCompany={handleSaveCompany}
                onMarkSeen={handleMarkSeen}
              />
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
                  Add a watched company, connect its careers source, then refresh that source to surface matching roles.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
