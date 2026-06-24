import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Building2, CheckCircle2, ExternalLink, Eye, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import {
  useRadarCriteria,
  useRadarPostings,
  useRadarSearchSources,
  useSearchTrustedSources,
  useUpdateRadarCriteria,
  useUpdateRadarPostingStatus,
} from '@/hooks/useRadar';
import type { RadarPostingsParams } from '@/api/radar.api';
import type { RadarSearchSource } from '@/api/radar.api';
import type {
  DiscoveredPosting,
  RadarCriteria,
  PostingStatus,
  PostingValidityStatus,
  SourceTier,
} from '@shared/schemas';

type StatusFilter = Extract<PostingStatus, 'new' | 'seen' | 'dismissed'>;
type DiscoveryView = 'job_boards' | 'live_only' | 'closed' | 'all';
type LocationRule = RadarCriteria['location_rules'][number];
type RadarPostingView = DiscoveredPosting;
type ProvenanceSource = { sourceName?: string; source_name?: string; name?: string };

interface CompanyGroup {
  company: string;
  postings: RadarPostingView[];
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'seen', label: 'Seen' },
  { value: 'dismissed', label: 'Dismissed' },
];

const VIEW_OPTIONS: Array<{ value: DiscoveryView; label: string }> = [
  { value: 'job_boards', label: 'Saved job-board results' },
  { value: 'live_only', label: 'Live only' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All saved job-board results' },
];

const LOCATION_OPTIONS: Array<{ value: LocationRule; label: string }> = [
  { value: 'remote_us', label: 'Remote' },
  { value: 'onsite', label: 'Onsite' },
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

function searchSourceStatus(source: RadarSearchSource): string {
  if (source.is_searchable) return 'Searchable';
  if (!source.is_active) return 'Not active';
  return 'Not connected';
}

function sourceName(posting: RadarPostingView): string {
  if (posting.first_seen_source && posting.first_seen_source !== 'radar') {
    return posting.first_seen_source;
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

function isClosedPosting(posting: RadarPostingView): boolean {
  const status = validityStatus(posting);
  return status === 'closed' || status === 'not_found';
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

function parseTerms(value: string): string[] {
  return [...new Set(value
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean))]
    .slice(0, 25);
}

function formatTerms(terms: string[] | undefined): string {
  return (terms ?? []).join(', ');
}

function trustedSourceErrorMessage(sources: Array<{ sourceName: string; error: string | null }>): string | null {
  const failedSources = sources.filter((source) => source.error);
  if (failedSources.length === 0) return null;

  return failedSources
    .map((source) => `${source.sourceName}: ${source.error}`)
    .join('; ');
}

export function hasFormSearchAnchor(
  titleTerms: string,
  locationTerms: string,
  locationRules: LocationRule[],
): boolean {
  return parseTerms(titleTerms).length > 0
    || parseTerms(locationTerms).length > 0
    || locationRules.length > 0;
}

function matchReasons(posting: RadarPostingView): string[] {
  const payload = posting.raw_payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  const reasons = (payload as { match_reasons?: unknown }).match_reasons;
  if (!Array.isArray(reasons)) return [];

  return reasons
    .filter((reason): reason is string => typeof reason === 'string' && reason.trim().length > 0)
    .slice(0, 4);
}

export function radarViewParams(view: DiscoveryView): Pick<RadarPostingsParams, 'source_tier' | 'validity_status' | 'sort' | 'include_closed'> {
  if (view === 'job_boards') return { source_tier: 'curated_board', sort: 'quality' };
  if (view === 'live_only') return { source_tier: 'curated_board', validity_status: 'live', sort: 'quality' };
  if (view === 'closed') return { source_tier: 'curated_board', validity_status: 'closed', sort: 'first_seen' };
  return { source_tier: 'curated_board', sort: 'quality', include_closed: true };
}

function groupByCompany(postings: RadarPostingView[]): CompanyGroup[] {
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
      };
    })
    .sort((left, right) => right.postings[0].first_seen_at.localeCompare(left.postings[0].first_seen_at));
}

export function splitPostingsByClosedState(postings: RadarPostingView[]): {
  activePostings: RadarPostingView[];
  closedPostings: RadarPostingView[];
} {
  return {
    activePostings: postings.filter((posting) => !isClosedPosting(posting)),
    closedPostings: postings.filter(isClosedPosting),
  };
}

function companyInitials(company: string): string {
  const words = company.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'CO';
}

interface PostingRowProps {
  posting: RadarPostingView;
  onMarkSeen: (posting: RadarPostingView) => void;
}

function PostingRow({
  posting,
  onMarkSeen,
}: PostingRowProps) {
  const status = validityStatus(posting);
  const tier = sourceTier(posting);
  const isClosed = isClosedPosting(posting);
  const seenSources = alsoSeenOn(posting);
  const reasons = matchReasons(posting);
  const source = sourceName(posting);
  const relativeFirstSeen = formatRelativeTime(posting.first_seen_at);

  return (
    <div className={`flex flex-col gap-3 border-t px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between ${isClosed ? 'bg-[color:var(--soft)] opacity-80' : ''}`} style={{ borderColor: 'var(--line)' }}>
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
          {reasons.map((reason) => (
            <span key={reason}>Matched {reason}</span>
          ))}
        </div>
      </div>

      <a
        href={posting.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => { if (posting.status === 'new') onMarkSeen(posting); }}
        className={`btn-primary inline-flex min-h-9 items-center gap-2 px-3 text-sm ${isClosed ? 'pointer-events-none opacity-60' : ''}`}
        aria-disabled={isClosed}
      >
        Open posting
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

interface CompanyRadarCardProps {
  group: CompanyGroup;
  onMarkSeen: (posting: RadarPostingView) => void;
}

function CompanyRadarCard({
  group,
  onMarkSeen,
}: CompanyRadarCardProps) {
  const { activePostings, closedPostings } = splitPostingsByClosedState(group.postings);
  const visiblePostings = activePostings.length > 0 ? activePostings : closedPostings;
  const collapsedClosedPostings = activePostings.length > 0 ? closedPostings : [];
  const primarySource = sourceName(group.postings[0]);

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
              {primarySource}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {closedPostings.length > 0 && (
            <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
              {closedPostings.length} closed
            </span>
          )}
        </div>
      </div>

      <div>
        {visiblePostings.map((posting) => (
          <PostingRow
            key={posting.id}
            posting={posting}
            onMarkSeen={onMarkSeen}
          />
        ))}
        {collapsedClosedPostings.length > 0 && (
          <details className="border-t" style={{ borderColor: 'var(--line)' }}>
            <summary className="cursor-pointer px-4 py-2 text-xs font-semibold" style={{ color: 'var(--ink-3)' }}>
              Closed postings ({collapsedClosedPostings.length})
            </summary>
            {collapsedClosedPostings.map((posting) => (
              <PostingRow
                key={posting.id}
                posting={posting}
                onMarkSeen={onMarkSeen}
              />
            ))}
          </details>
        )}
      </div>
    </section>
  );
}

export function RadarPage() {
  const [status, setStatus] = useState<StatusFilter>('new');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<DiscoveryView>('job_boards');
  const [titleTerms, setTitleTerms] = useState('');
  const [fieldTerms, setFieldTerms] = useState('');
  const [locationTerms, setLocationTerms] = useState('');
  const [excludeTerms, setExcludeTerms] = useState('');
  const [locationRules, setLocationRules] = useState<LocationRule[]>([]);

  const queryParams = useMemo<RadarPostingsParams>(() => ({
    ...(status && { status }),
    ...(search.trim() && { search: search.trim() }),
    ...radarViewParams(view),
  }), [search, status, view]);

  const { data: postings = [], isLoading, error } = useRadarPostings(queryParams);
  const { data: criteria } = useRadarCriteria();
  const { data: searchSources = [] } = useRadarSearchSources();
  const updatePostingStatus = useUpdateRadarPostingStatus();
  const updateCriteria = useUpdateRadarCriteria();
  const trustedSourceSearch = useSearchTrustedSources();

  useEffect(() => {
    if (!criteria) return;

    setTitleTerms(formatTerms(criteria.title_terms));
    setFieldTerms(formatTerms(criteria.field_terms));
    setLocationTerms(formatTerms(criteria.location_terms));
    setExcludeTerms(formatTerms(criteria.exclude_keywords));
    const supportedLocationRules = criteria.location_rules.filter((rule) => rule === 'remote_us' || rule === 'onsite');
    setLocationRules(supportedLocationRules);
  }, [criteria]);

  const companyGroups = useMemo(() => groupByCompany(postings as RadarPostingView[]), [postings]);
  const canSearchTrustedSources = hasFormSearchAnchor(titleTerms, locationTerms, locationRules);
  const searchableSourceCount = searchSources.filter((source) => source.is_searchable).length;
  const canRunJobBoardSearch = canSearchTrustedSources && searchableSourceCount > 0;
  const hasSearchableJobBoards = searchableSourceCount > 0;
  const listedUnsearchableSources = searchSources
    .filter((source) => !source.is_searchable)
    .map((source) => source.source_name)
    .join(', ');

  const metrics = useMemo(() => {
    const viewPostings = postings as RadarPostingView[];
    const newToday = viewPostings.filter((posting) => posting.status === 'new').length;
    const jobBoards = viewPostings.filter((posting) => sourceTier(posting) === 'curated_board').length;
    const live = viewPostings.filter((posting) => validityStatus(posting) === 'live').length;
    const closed = viewPostings.filter((posting) => {
      const postingValidity = validityStatus(posting);
      return postingValidity === 'closed' || postingValidity === 'not_found';
    }).length;

    return { newToday, jobBoards, live, closed };
  }, [postings]);

  async function handleMarkSeen(posting: RadarPostingView) {
    if (posting.status !== 'new') return;

    try {
      await updatePostingStatus.mutateAsync({ id: posting.id, status: 'seen' });
    } catch {
      // Opening the source posting should not be blocked by status bookkeeping.
    }
  }

  function criteriaPayload() {
    return {
      title_terms: parseTerms(titleTerms),
      field_terms: parseTerms(fieldTerms),
      include_keywords: [],
      exclude_keywords: parseTerms(excludeTerms),
      seniority_terms: [],
      location_terms: parseTerms(locationTerms),
      location_rules: locationRules,
    };
  }

  async function handleSaveCriteria() {
    try {
      await updateCriteria.mutateAsync(criteriaPayload());
      toast.success('Radar criteria saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save Radar criteria'));
    }
  }

  async function handleSearchTrustedSources() {
    if (searchableSourceCount === 0) {
      toast.error('No connected job boards are available to search');
      return;
    }

    if (!canSearchTrustedSources) {
      toast.error('Add a target title or location before searching');
      return;
    }

    try {
      await updateCriteria.mutateAsync(criteriaPayload());
      const result = await trustedSourceSearch.mutateAsync();
      const sourceError = trustedSourceErrorMessage(result.sources);
      if (result.sources_searched === 0) {
        toast.warning(result.message);
        return;
      }
      if (sourceError) {
        toast.warning(result.message, { description: sourceError });
        return;
      }
      toast.success(result.message);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not search job boards'));
    }
  }

  function toggleLocationRule(rule: LocationRule) {
    setLocationRules((current) => {
      if (current.includes(rule)) {
        return current.filter((item) => item !== rule);
      }
      return [...current, rule];
    });
  }

  const hasFilters = status !== 'new' || search.trim() || view !== 'job_boards';

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mobile-safe-bottom flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:pb-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Job Search
          </h1>
          <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
            Search connected job boards by role, location, and filters.
          </span>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={18} style={{ color: 'var(--ink-3)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              Job-board results
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

        <section className="rounded-lg border bg-white p-3 shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <div className="mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              Job-board search criteria
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
              Save criteria any time. Searching runs only against connected job-board sources.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
            <label>
              <span className="field-label">Target titles</span>
              <input
                type="text"
                value={titleTerms}
                onChange={(event) => setTitleTerms(event.target.value)}
                className="field-input"
                placeholder="software engineer, backend engineer"
              />
            </label>
            <label>
              <span className="field-label">Fields or industries</span>
              <input
                type="text"
                value={fieldTerms}
                onChange={(event) => setFieldTerms(event.target.value)}
                className="field-input"
                placeholder="edtech, civic tech, nonprofit tech"
              />
            </label>
            <label>
              <span className="field-label">Locations</span>
              <input
                type="text"
                value={locationTerms}
                onChange={(event) => setLocationTerms(event.target.value)}
                className="field-input"
                placeholder="New York, Chicago, Bay Area"
              />
            </label>
            <label>
              <span className="field-label">Exclude terms</span>
              <input
                type="text"
                value={excludeTerms}
                onChange={(event) => setExcludeTerms(event.target.value)}
                className="field-input"
                placeholder="junior, intern, internship"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={hasSearchableJobBoards ? 'btn-outline min-h-11 px-3 text-sm' : 'btn-primary min-h-11 px-3 text-sm'}
                onClick={handleSaveCriteria}
                disabled={updateCriteria.isPending}
              >
                Save criteria
              </button>
              {hasSearchableJobBoards ? (
                <button
                  type="button"
                  className="btn-primary inline-flex min-h-11 items-center gap-2 px-3 text-sm"
                  onClick={handleSearchTrustedSources}
                  disabled={trustedSourceSearch.isPending || updateCriteria.isPending || !canRunJobBoardSearch}
                  title={canSearchTrustedSources ? undefined : 'Add a target title or location before searching'}
                >
                  {trustedSourceSearch.isPending ? <Spinner size="sm" color="white" /> : <Search size={16} />}
                  Search job boards
                </button>
              ) : (
                <span
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium"
                  style={{ borderColor: 'var(--line)', background: 'var(--soft)', color: 'var(--ink-3)' }}
                >
                  <Search size={16} />
                  No job boards connected
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                <input
                  type="checkbox"
                  checked={locationRules.includes(option.value)}
                  onChange={() => toggleLocationRule(option.value)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-3 shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                Job-board source status
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                {searchableSourceCount} searchable / {searchSources.length} listed
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasSearchableJobBoards ? searchSources.map((source) => (
                <span
                  key={source.id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: source.is_searchable ? 'var(--sage)' : 'var(--line)',
                    color: source.is_searchable ? 'var(--sage)' : 'var(--ink-3)',
                    background: source.is_searchable ? 'var(--sage-tint)' : 'white',
                  }}
                  title={`${source.source_name}: ${searchSourceStatus(source)}`}
                >
                  {source.source_name}
                  <span className="font-medium">{searchSourceStatus(source)}</span>
                </span>
              )) : (
                <span className="text-sm font-medium" style={{ color: 'var(--ink-3)' }}>
                  No connected job-board sources
                </span>
              )}
            </div>
          </div>
          {searchableSourceCount === 0 && (
            <div className="mt-3 rounded-lg border p-3 text-sm" style={{ background: 'var(--soft)', borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
              There is no external job board connected right now, so targeted job-board search cannot run yet.
              {listedUnsearchableSources && (
                <span className="mt-2 block text-xs">
                  Listed but not connected: {listedUnsearchableSources}.
                </span>
              )}
            </div>
          )}
        </section>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>New</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{metrics.newToday}</p>
          </div>
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Job boards</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{metrics.jobBoards}</p>
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
          <div className="mobile-filter-scroll md:grid md:grid-cols-[180px_1fr_auto] md:items-center md:overflow-visible md:pb-0">
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

            <label className="min-w-64 md:min-w-0">
              <span className="field-label">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--ink-4)' }} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, company, location..."
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
                  setSearch('');
                  setView('job_boards');
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
                  {view === 'job_boards' && searchableSourceCount === 0
                    ? 'No connected job board can be searched yet.'
                    : 'No saved results match the current view.'}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
