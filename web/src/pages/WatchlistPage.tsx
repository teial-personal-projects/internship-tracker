import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpDown, Building2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/Spinner';
import {
  useCreateWatchlistEntry,
  useDeleteWatchlistEntry,
  useRefreshWatchlistRadar,
  useUpdateWatchlistEntry,
  useWatchlist,
} from '@/hooks/useWatchlist';
import { formatDate, todayStr } from '@/lib/dateUtils';
import type { WatchlistEntry, WatchlistRadarRefreshResult } from '@/api/watchlist.api';
import type { AtsType, CreateCompanyWatchlistEntrySchemaType, SourceTier, TaskPriority } from '@shared/schemas';

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

const SOURCE_TIER_OPTIONS: Array<{ value: SourceTier; label: string; description: string }> = [
  {
    value: 'direct_ats',
    label: 'Direct ATS',
    description: 'Refreshes from the company career system and ranks as the freshest source.',
  },
  {
    value: 'curated_board',
    label: 'Curated board',
    description: 'Stores a board source such as LinkedIn or Idealist for future discovery adapters.',
  },
  {
    value: 'aggregator',
    label: 'Aggregator',
    description: 'Stores syndication context only; aggregator rows will support corroboration later.',
  },
];

interface CareersSource {
  atsType: AtsType;
  value: string;
}

function normalizeCareersUrlInput(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function firstPathSegment(url: URL): string | null {
  const [segment] = url.pathname.split('/').filter(Boolean);
  return segment ? decodeURIComponent(segment) : null;
}

function inferCareersSource(input: string): CareersSource | null {
  const url = normalizeCareersUrlInput(input);
  if (!url) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const firstSegment = firstPathSegment(url);

  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
    return firstSegment ? { atsType: 'greenhouse', value: firstSegment } : null;
  }

  if (host === 'jobs.lever.co') {
    return firstSegment ? { atsType: 'lever', value: firstSegment } : null;
  }

  if (host === 'jobs.ashbyhq.com') {
    return firstSegment ? { atsType: 'ashby', value: firstSegment } : null;
  }

  if (host.endsWith('smartrecruiters.com')) {
    return firstSegment ? { atsType: 'smartrecruiters', value: firstSegment } : null;
  }

  if (host.endsWith('pinpointhq.com')) {
    return { atsType: 'pinpoint', value: url.href };
  }

  if (host.endsWith('welcomekit.co') || host.endsWith('welcometothejungle.com')) {
    return { atsType: 'welcomekit', value: url.href };
  }

  return { atsType: 'custom', value: url.href };
}

function sourceTier(entry: WatchlistEntry): SourceTier {
  return entry.source_tier ?? 'direct_ats';
}

function sourceTierLabel(tier: SourceTier): string {
  return SOURCE_TIER_OPTIONS.find((option) => option.value === tier)?.label ?? 'Direct ATS';
}

function sourceUrlFromEntry(entry: WatchlistEntry | null): string {
  const sourceValue = entry?.ats_board_token?.trim();
  if (!sourceValue) return '';
  if (/^https?:\/\//i.test(sourceValue)) return sourceValue;

  switch (entry?.ats_type) {
    case 'greenhouse':
      return `https://boards.greenhouse.io/${sourceValue}`;
    case 'lever':
      return `https://jobs.lever.co/${sourceValue}`;
    case 'ashby':
      return `https://jobs.ashbyhq.com/${sourceValue}`;
    case 'smartrecruiters':
      return `https://jobs.smartrecruiters.com/${sourceValue}`;
    default:
      return sourceValue;
  }
}

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

function canRefreshSource(entry: WatchlistEntry): boolean {
  return Boolean(entry.radar_enabled && sourceTier(entry) === 'direct_ats' && entry.ats_type && entry.ats_board_token);
}

interface WatchlistRowProps {
  entry: WatchlistEntry;
  onEdit: (entry: WatchlistEntry) => void;
  onDelete: (entry: WatchlistEntry) => void;
  onRefresh: (entry: WatchlistEntry) => void;
  isDeleting: boolean;
  isRefreshing: boolean;
  refreshResult: WatchlistRadarRefreshResult | undefined;
  refreshError: string | undefined;
}

function RefreshStatus({
  entry,
  isRefreshing,
  refreshResult,
  refreshError,
}: {
  entry: WatchlistEntry;
  isRefreshing: boolean;
  refreshResult: WatchlistRadarRefreshResult | undefined;
  refreshError: string | undefined;
}) {
  if (!entry.radar_enabled) {
    return (
      <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
        Idle
      </p>
    );
  }

  if (sourceTier(entry) !== 'direct_ats') {
    return (
      <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
        Saved for provenance
      </p>
    );
  }

  if (!canRefreshSource(entry)) {
    return (
      <p className="mt-1 truncate text-xs" style={{ color: '#B91C1C' }}>
        Missing careers source
      </p>
    );
  }

  if (isRefreshing) {
    return (
      <p className="mt-1 truncate text-xs" style={{ color: 'var(--accent-dark)' }}>
        Refreshing...
      </p>
    );
  }

  if (refreshError) {
    return (
      <p className="mt-1 truncate text-xs" title={refreshError} style={{ color: '#B91C1C' }}>
        Error: {refreshError}
      </p>
    );
  }

  if (refreshResult) {
    return (
      <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
        {refreshResult.inserted} new / {refreshResult.matched} matched
      </p>
    );
  }

  return (
    <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
      Last refreshed: {formatDateTime(entry.last_refreshed_at)}
    </p>
  );
}

function WatchlistRow({
  entry,
  onEdit,
  onDelete,
  onRefresh,
  isDeleting,
  isRefreshing,
  refreshResult,
  refreshError,
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
            {entry.radar_enabled ? sourceTierLabel(sourceTier(entry)) : 'Source off'}
          </span>
        </div>
        {entry.source_name && (
          <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
            {entry.source_name}
          </p>
        )}
        <RefreshStatus entry={entry} isRefreshing={isRefreshing} refreshResult={refreshResult} refreshError={refreshError} />
      </div>

      <p className="truncate text-sm" style={{ color: entry.notes ? 'var(--ink-2)' : 'var(--ink-3)' }}>
        {notesPreview(entry.notes)}
      </p>

      <div className="flex items-center justify-end gap-1">
        {entry.radar_enabled && (
          <button
            type="button"
            onClick={() => onRefresh(entry)}
            disabled={isRefreshing || !canRefreshSource(entry)}
            className="btn-outline flex h-8 items-center gap-1 px-2 text-xs"
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        )}
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
  onRefresh,
  isDeleting,
  isRefreshing,
  refreshResult,
  refreshError,
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
            Source
          </p>
          <p className="mt-1" style={{ color: 'var(--ink-2)' }}>
            {entry.radar_enabled ? sourceTierLabel(sourceTier(entry)) : 'Not enabled'}
          </p>
          {entry.source_name && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
              {entry.source_name}
            </p>
          )}
          <RefreshStatus entry={entry} isRefreshing={isRefreshing} refreshResult={refreshResult} refreshError={refreshError} />
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
            disabled={isRefreshing || !canRefreshSource(entry)}
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        )}
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
  const [careersUrl, setCareersUrl] = useState('');
  const [atsType, setAtsType] = useState<AtsType | ''>('');
  const [atsBoardToken, setAtsBoardToken] = useState('');
  const [selectedSourceTier, setSelectedSourceTier] = useState<SourceTier>('direct_ats');
  const [sourceName, setSourceName] = useState('');
  const [useManualSource, setUseManualSource] = useState(false);
  const [radarEnabled, setRadarEnabled] = useState(false);

  const isDirectAts = selectedSourceTier === 'direct_ats';
  const inferredSource = useMemo(() => (isDirectAts ? inferCareersSource(careersUrl) : null), [careersUrl, isDirectAts]);

  useEffect(() => {
    if (!isOpen) return;
    setCompanyName(entry?.company_name ?? '');
    setIndustry(entry?.industry ?? '');
    setWebsite(entry?.website ?? '');
    setPriority(entry?.priority ?? '');
    setTargetApplyDate(entry?.target_apply_date ?? '');
    setAdded(entry?.added ?? todayStr());
    setNotes(entry?.notes ?? '');
    setCareersUrl(sourceUrlFromEntry(entry));
    setAtsType(entry?.ats_type ?? '');
    setAtsBoardToken(entry?.ats_board_token ?? '');
    setSelectedSourceTier(entry?.source_tier ?? 'direct_ats');
    setSourceName(entry?.source_name ?? '');
    setUseManualSource(false);
    setRadarEnabled(entry?.radar_enabled ?? false);
  }, [entry, isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const source = isDirectAts && useManualSource
      ? {
          atsType: atsType || null,
          value: atsBoardToken.trim() || null,
        }
      : isDirectAts ? {
          atsType: inferredSource?.atsType ?? null,
          value: inferredSource?.value ?? null,
        } : {
          atsType: null,
          value: null,
        };

    onSubmit({
      company_name: companyName.trim(),
      industry: industry.trim() || null,
      website: website.trim() || null,
      priority: priority || null,
      target_apply_date: targetApplyDate || null,
      added,
      notes: notes.trim() || null,
      ats_type: source.atsType,
      ats_board_token: source.value,
      radar_enabled: radarEnabled,
      source_tier: selectedSourceTier,
      source_name: sourceName.trim() || null,
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
                      Enable discovery
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

                <label className="mt-4 block">
                  <span className="field-label">Source Tier</span>
                  <select
                    className="field-select"
                    value={selectedSourceTier}
                    onChange={(event) => setSelectedSourceTier(event.target.value as SourceTier)}
                  >
                    {SOURCE_TIER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <div className="mt-3 rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
                  {SOURCE_TIER_OPTIONS.find((option) => option.value === selectedSourceTier)?.description}
                </div>

                {isDirectAts ? (
                  <>
                    <label className="mt-4 block">
                      <span className="field-label">Careers URL</span>
                      <input
                        className="field-input"
                        type="url"
                        placeholder="https://company.example.com/careers"
                        value={careersUrl}
                        onChange={(event) => setCareersUrl(event.target.value)}
                      />
                    </label>

                    <div className="mt-3 rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
                      {inferredSource
                        ? `Detected ${ATS_OPTIONS.find((option) => option.value === inferredSource.atsType)?.label ?? inferredSource.atsType} source.`
                        : 'Paste a careers URL to detect the source automatically.'}
                    </div>

                    <details className="mt-4 rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
                      <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        Advanced source settings
                      </summary>
                      <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                        <input
                          type="checkbox"
                          checked={useManualSource}
                          onChange={(event) => setUseManualSource(event.target.checked)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        Use manual source settings
                      </label>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <label>
                          <span className="field-label">Careers Source Type</span>
                          <select
                            className="field-select"
                            value={useManualSource ? atsType : inferredSource?.atsType ?? ''}
                            onChange={(event) => setAtsType(event.target.value as AtsType | '')}
                            disabled={!useManualSource}
                          >
                            <option value="">Not set</option>
                            {ATS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className="field-label">Careers Source</span>
                          <input
                            className="field-input"
                            value={useManualSource ? atsBoardToken : inferredSource?.value ?? ''}
                            onChange={(event) => setAtsBoardToken(event.target.value)}
                            placeholder="company careers source"
                            disabled={!useManualSource}
                          />
                        </label>
                      </div>
                    </details>
                  </>
                ) : (
                  <label className="mt-4 block">
                    <span className="field-label">Source Name</span>
                    <input
                      className="field-input"
                      placeholder={selectedSourceTier === 'curated_board' ? 'LinkedIn, Idealist, Remote.co' : 'Indeed, Talent.com, ZipRecruiter'}
                      value={sourceName}
                      onChange={(event) => setSourceName(event.target.value)}
                    />
                  </label>
                )}
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

interface WatchlistWorkspaceProps {
  embedded?: boolean;
}

export function WatchlistWorkspace({ embedded = false }: WatchlistWorkspaceProps) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [targetFrom, setTargetFrom] = useState('');
  const [targetTo, setTargetTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('added');
  const [editingEntry, setEditingEntry] = useState<WatchlistEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<WatchlistEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(() => new Set());
  const [refreshResults, setRefreshResults] = useState<Record<string, WatchlistRadarRefreshResult>>({});
  const [refreshErrors, setRefreshErrors] = useState<Record<string, string>>({});

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

  async function refreshEntry(entry: WatchlistEntry, showToast: boolean) {
    setRefreshingIds((current) => new Set(current).add(entry.id));
    setRefreshErrors((current) => {
      const next = { ...current };
      delete next[entry.id];
      return next;
    });

    try {
      const result = await refreshRadar.mutateAsync(entry.id);
      if (result.error) {
        setRefreshErrors((current) => ({ ...current, [entry.id]: result.error ?? 'Could not refresh source' }));
        if (showToast) {
          toast.error(result.error);
        }
        return;
      }

      setRefreshResults((current) => ({ ...current, [entry.id]: result }));
      if (showToast) {
        toast.success(`Source refreshed: ${result.inserted} new, ${result.matched} matched`);
      }
    } catch (error) {
      const message = apiErrorMessage(error, 'Could not refresh source');
      setRefreshErrors((current) => ({ ...current, [entry.id]: message }));
      if (showToast) {
        toast.error(message);
      }
    } finally {
      setRefreshingIds((current) => {
        const next = new Set(current);
        next.delete(entry.id);
        return next;
      });
    }
  }

  async function handleRefresh(entry: WatchlistEntry) {
    await refreshEntry(entry, true);
  }

  return (
    <>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            {embedded ? (
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                Watched Companies
              </h2>
            ) : (
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
                Watched Companies
              </h1>
            )}
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
              Save companies, configure careers sources, and refresh matched postings.
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
              Add a company you want to watch, configure its careers source, then refresh it to discover matching postings.
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
                <span>Source</span>
                <span>Notes</span>
                <span className="text-right">Actions</span>
              </div>
              {sortedEntries.map((entry) => (
                <WatchlistRow
                  key={entry.id}
                  entry={entry}
                  onEdit={openEditModal}
                  onDelete={setConfirmDeleteEntry}
                  onRefresh={handleRefresh}
                  isDeleting={deletingId === entry.id}
                  isRefreshing={refreshingIds.has(entry.id)}
                  refreshResult={refreshResults[entry.id]}
                  refreshError={refreshErrors[entry.id]}
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
                  onRefresh={handleRefresh}
                  isDeleting={deletingId === entry.id}
                  isRefreshing={refreshingIds.has(entry.id)}
                  refreshResult={refreshResults[entry.id]}
                  refreshError={refreshErrors[entry.id]}
                />
              ))}
            </section>
          </>
        )}
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
              This removes {confirmDeleteEntry?.company_name ?? 'this company'} from watched companies.
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
    </>
  );
}

export function WatchlistPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="mobile-safe-bottom mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 md:pb-8">
        <WatchlistWorkspace />
      </main>
    </div>
  );
}
