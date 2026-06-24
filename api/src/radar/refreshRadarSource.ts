import type { AtsType } from '@internship-tracker/shared';
import type { RadarCriteria } from '@internship-tracker/shared';
import type { NormalizedPosting } from './adapters/types';
import { getAtsAdapter } from './adapters/registry';
import { createPostingFingerprint } from './fingerprint';
import { criteriaFromRow, matches } from './match';
import { getAtsSourceMetadata, getRadarSourceMetadata, RADAR_SOURCE_REGISTRY } from './sources/registry';

type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';

type RadarSourceRow = {
  id: string;
  user_id: string;
  company_name?: string;
  ats_type: AtsType | null;
  ats_board_token: string | null;
  radar_enabled: boolean;
  source_tier?: SourceTier;
  source_name?: string | null;
  radar_source_id?: string | null;
};

type DbResult<T> = Promise<{ data: T; error: { message: string } | null }>;

type ExistingPostingRow = {
  id: string;
  company_name: string;
  external_job_id: string;
  title: string;
  url: string;
  source_tier: SourceTier;
  first_seen_source: string;
  also_seen_on: unknown;
  source_first_seen_at: unknown;
  raw_payload: unknown;
};

type SourceMetadata = {
  name: string;
  tier: SourceTier;
};

type ProvenanceEntry = {
  source_name: string;
  source_tier: SourceTier;
  external_job_id: string;
  url: string;
};

export interface RadarRefreshDb {
  from(table: string): {
    select(columns?: string): unknown;
    insert?(payload: Record<string, unknown>): unknown;
    update?(payload: Record<string, unknown>): unknown;
    eq?(column: string, value: string | boolean): unknown;
    single?(): DbResult<Record<string, unknown> | null>;
  };
}

interface RefreshResult {
  inserted: number;
  matched: number;
  fetched: number;
  error: string | null;
}

export type RadarIngestionDb = RadarRefreshDb;

function toQuery<T>(value: unknown): T {
  return value as T;
}

function isMissingRadarCriteriaTable(error: { message: string } | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes('radar_criteria') && message.includes('schema');
}

function isMissingRadarSourcesTable(error: { message: string } | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes('radar_sources') && message.includes('schema');
}

function normalizeSourceId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function sourceAuthority(tier: SourceTier): number {
  if (tier === 'direct_ats') return 1;
  if (tier === 'curated_board') return 2;
  return 3;
}

function hasHigherAuthority(candidate: SourceTier, current: SourceTier): boolean {
  return sourceAuthority(candidate) < sourceAuthority(current);
}

function rawObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringFromRaw(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function findRegistryMetadata(sourceId: string): SourceMetadata | null {
  const byId = getRadarSourceMetadata(sourceId);
  if (byId) return { name: byId.name, tier: byId.tier };

  const normalized = normalizeSourceId(sourceId);
  const byName = Object.values(RADAR_SOURCE_REGISTRY).find((source) =>
    normalizeSourceId(source.name) === normalized,
  );
  return byName ? { name: byName.name, tier: byName.tier } : null;
}

function fallbackSourceMetadata(source: RadarSourceRow, posting: NormalizedPosting): SourceMetadata {
  if (posting.sourceName) {
    const metadata = findRegistryMetadata(posting.sourceName);
    return metadata ?? {
      name: posting.sourceName,
      tier: posting.sourceTier ?? source.source_tier ?? 'direct_ats',
    };
  }

  if (source.ats_type) {
    const metadata = getAtsSourceMetadata(source.ats_type);
    if (metadata) return { name: metadata.name, tier: metadata.tier };
  }

  if (source.source_name) {
    const metadata = findRegistryMetadata(source.source_name);
    return metadata ?? {
      name: source.source_name,
      tier: posting.sourceTier ?? source.source_tier ?? 'direct_ats',
    };
  }

  return {
    name: 'Radar',
    tier: posting.sourceTier ?? source.source_tier ?? 'direct_ats',
  };
}

async function getSourceMetadata(
  db: RadarRefreshDb,
  source: RadarSourceRow,
  posting: NormalizedPosting,
): Promise<SourceMetadata> {
  const fallback = fallbackSourceMetadata(source, posting);
  const sourceId = posting.sourceName
    ? normalizeSourceId(posting.sourceName)
    : source.radar_source_id ?? source.ats_type ?? (source.source_name ? normalizeSourceId(source.source_name) : null);

  if (!sourceId) return fallback;

  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: string): unknown;
  }>(db.from('radar_sources'));

  const result = await toQuery<Promise<{ data: Array<{ source_name: string; source_tier: SourceTier }> | null; error: { message: string } | null }>>(
    toQuery<{ eq(column: string, value: string): unknown }>(
      query.select('source_name, source_tier'),
    ).eq('id', sourceId),
  );

  if (result.error) {
    if (isMissingRadarSourcesTable(result.error)) return fallback;
    return fallback;
  }

  const row = result.data?.[0];
  return row ? { name: row.source_name, tier: row.source_tier } : fallback;
}

async function getExistingWatchlistPostingIds(
  db: RadarRefreshDb,
  watchlistId: string,
): Promise<Set<string>> {
  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: string): unknown;
  }>(db.from('discovered_postings'));

  const result = await toQuery<Promise<{ data: Array<{ external_job_id: string }> | null; error: { message: string } | null }>>(
    toQuery<{ eq(column: string, value: string): unknown }>(
      query.select('external_job_id'),
    ).eq('watchlist_id', watchlistId),
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return new Set((result.data ?? []).map((row) => row.external_job_id));
}

async function getExistingRadarSourcePostingIds(
  db: RadarRefreshDb,
  userId: string,
  radarSourceId: string,
): Promise<Set<string>> {
  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: string): unknown;
  }>(db.from('discovered_postings'));

  const result = await toQuery<Promise<{ data: Array<{ external_job_id: string }> | null; error: { message: string } | null }>>(
    toQuery<{ eq(column: string, value: string): unknown }>(
      toQuery<{ eq(column: string, value: string): unknown }>(
        query.select('external_job_id'),
      ).eq('user_id', userId),
    ).eq('radar_source_id', radarSourceId),
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return new Set((result.data ?? []).map((row) => row.external_job_id));
}

async function getExistingPostingIds(
  db: RadarRefreshDb,
  source: RadarSourceRow,
): Promise<Set<string>> {
  if (source.radar_source_id) {
    return getExistingRadarSourcePostingIds(db, source.user_id, source.radar_source_id);
  }
  return getExistingWatchlistPostingIds(db, source.id);
}

async function getExistingPostingsForUser(
  db: RadarRefreshDb,
  userId: string,
): Promise<ExistingPostingRow[]> {
  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: string): unknown;
  }>(db.from('discovered_postings'));

  const result = await toQuery<Promise<{ data: ExistingPostingRow[] | null; error: { message: string } | null }>>(
    toQuery<{ eq(column: string, value: string): unknown }>(
      query.select('id, company_name, external_job_id, title, url, source_tier, first_seen_source, also_seen_on, source_first_seen_at, raw_payload'),
    ).eq('user_id', userId),
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

async function getRadarCriteria(
  db: RadarRefreshDb,
  userId: string,
): Promise<ReturnType<typeof criteriaFromRow>> {
  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: string): unknown;
  }>(db.from('radar_criteria'));

  const result = await toQuery<Promise<{ data: RadarCriteria[] | null; error: { message: string } | null }>>(
    toQuery<{ eq(column: string, value: string): unknown }>(
      query.select('user_id, title_terms, field_terms, include_keywords, exclude_keywords, seniority_terms, location_rules, created_at, updated_at'),
    ).eq('user_id', userId),
  );

  if (result.error) {
    if (isMissingRadarCriteriaTable(result.error)) {
      return criteriaFromRow(null);
    }
    throw new Error(result.error.message);
  }

  return criteriaFromRow(result.data?.[0] ?? null);
}

async function insertPosting(
  db: RadarRefreshDb,
  source: RadarSourceRow,
  posting: NormalizedPosting,
  sourceMetadata: SourceMetadata,
): Promise<void> {
  const query = toQuery<{
    insert(payload: Record<string, unknown>): unknown;
  }>(db.from('discovered_postings'));

  const now = new Date().toISOString();
  const companyName = posting.companyName ?? source.company_name;
  if (!companyName) {
    throw new Error('Source-discovered posting is missing company name');
  }

  const result = await toQuery<Promise<{ data: unknown; error: { message: string } | null }>>(
    query.insert({
      user_id: source.user_id,
      watchlist_id: source.radar_source_id ? null : source.id,
      radar_source_id: source.radar_source_id ?? null,
      company_name: companyName,
      external_job_id: posting.externalId,
      title: posting.title,
      location: posting.location,
      remote_status: posting.remoteStatus,
      url: posting.url,
      posted_at: posting.postedAt,
      status: 'new',
      source_tier: sourceMetadata.tier,
      first_seen_source: sourceMetadata.name,
      also_seen_on: [],
      source_first_seen_at: { [sourceMetadata.name]: now },
      raw_payload: {
        ...rawObject(posting.raw),
        canonicalUrl: posting.canonicalUrl ?? null,
        companyDomain: posting.companyDomain ?? null,
      },
    }),
  );

  if (result.error) {
    throw new Error(result.error.message);
  }
}

function toProvenanceArray(value: unknown): ProvenanceEntry[] {
  return Array.isArray(value) ? value.filter((entry): entry is ProvenanceEntry =>
    Boolean(entry)
    && typeof entry === 'object'
    && typeof (entry as ProvenanceEntry).source_name === 'string',
  ) : [];
}

function toSourceFirstSeen(value: unknown): Record<string, string> {
  const record = rawObject(value);
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

function buildFingerprintInput(row: ExistingPostingRow) {
  const raw = rawObject(row.raw_payload);
  return {
    externalId: row.external_job_id,
    title: row.title,
    url: row.url,
    canonicalUrl: stringFromRaw(raw.canonicalUrl),
    companyDomain: stringFromRaw(raw.companyDomain),
  };
}

function findFingerprintMatch(
  source: RadarSourceRow,
  posting: NormalizedPosting,
  existingPostings: ExistingPostingRow[],
): ExistingPostingRow | null {
  const companyName = posting.companyName ?? source.company_name;
  if (!companyName) return null;

  const postingFingerprint = createPostingFingerprint(companyName, posting);
  return existingPostings.find((existing) =>
    createPostingFingerprint(existing.company_name, buildFingerprintInput(existing)) === postingFingerprint,
  ) ?? null;
}

async function appendPostingProvenance(
  db: RadarRefreshDb,
  existing: ExistingPostingRow,
  posting: NormalizedPosting,
  sourceMetadata: SourceMetadata,
): Promise<void> {
  const now = new Date().toISOString();
  const alsoSeenOn = toProvenanceArray(existing.also_seen_on);
  const sourceAlreadyRecorded = existing.first_seen_source === sourceMetadata.name
    || alsoSeenOn.some((entry) => entry.source_name === sourceMetadata.name);
  const sourceFirstSeenAt = toSourceFirstSeen(existing.source_first_seen_at);

  if (!sourceFirstSeenAt[sourceMetadata.name]) {
    sourceFirstSeenAt[sourceMetadata.name] = now;
  }

  const nextAlsoSeenOn = sourceAlreadyRecorded
    ? alsoSeenOn
    : [
        ...alsoSeenOn,
        {
          source_name: sourceMetadata.name,
          source_tier: sourceMetadata.tier,
          external_job_id: posting.externalId,
          url: posting.url,
        },
      ];

  const payload: Record<string, unknown> = {
    also_seen_on: nextAlsoSeenOn,
    source_first_seen_at: sourceFirstSeenAt,
  };

  if (hasHigherAuthority(sourceMetadata.tier, existing.source_tier)) {
    payload.source_tier = sourceMetadata.tier;
    payload.external_job_id = posting.externalId;
    payload.url = posting.url;
    payload.raw_payload = {
      ...rawObject(posting.raw),
      canonicalUrl: posting.canonicalUrl ?? null,
      companyDomain: posting.companyDomain ?? null,
    };
  }

  const query = toQuery<{
    update(payload: Record<string, unknown>): {
      eq(column: string, value: string): DbResult<unknown>;
    };
  }>(db.from('discovered_postings'));

  const result = await query.update(payload).eq('id', existing.id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function updateLastRefreshedAt(
  db: RadarRefreshDb,
  watchlistId: string,
): Promise<void> {
  const query = toQuery<{
    update(payload: Record<string, unknown>): {
      eq(column: string, value: string): DbResult<unknown>;
    };
  }>(db.from('company_watchlist'));

  const result = await query
    .update({ last_refreshed_at: new Date().toISOString() })
    .eq('id', watchlistId);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function ingestRadarPostings(
  db: RadarIngestionDb,
  source: RadarSourceRow,
  postings: NormalizedPosting[],
  criteria?: ReturnType<typeof criteriaFromRow>,
): Promise<RefreshResult> {
  let inserted = 0;
  const activeCriteria = criteria ?? await getRadarCriteria(db, source.user_id);
  const matchedPostings = postings.filter((posting) => matches(posting, activeCriteria));
  const existingIds = await getExistingPostingIds(db, source);
  const existingPostings = await getExistingPostingsForUser(db, source.user_id);

  for (const posting of matchedPostings) {
    if (existingIds.has(posting.externalId)) continue;

    const sourceMetadata = await getSourceMetadata(db, source, posting);
    const existingFingerprintMatch = findFingerprintMatch(source, posting, existingPostings);
    if (existingFingerprintMatch) {
      await appendPostingProvenance(db, existingFingerprintMatch, posting, sourceMetadata);
      existingIds.add(posting.externalId);
      continue;
    }

    await insertPosting(db, source, posting, sourceMetadata);
    existingIds.add(posting.externalId);
    existingPostings.push({
      id: '',
      company_name: posting.companyName ?? source.company_name ?? '',
      external_job_id: posting.externalId,
      title: posting.title,
      url: posting.url,
      source_tier: sourceMetadata.tier,
      first_seen_source: sourceMetadata.name,
      also_seen_on: [],
      source_first_seen_at: { [sourceMetadata.name]: new Date().toISOString() },
      raw_payload: {
        ...rawObject(posting.raw),
        canonicalUrl: posting.canonicalUrl ?? null,
        companyDomain: posting.companyDomain ?? null,
      },
    });
    inserted += 1;
  }

  return {
    inserted,
    matched: matchedPostings.length,
    fetched: postings.length,
    error: null,
  };
}

export async function refreshRadarSource(
  db: RadarRefreshDb,
  source: RadarSourceRow,
): Promise<RefreshResult> {
  if (!source.radar_enabled) {
    return { inserted: 0, matched: 0, fetched: 0, error: 'Radar source is not enabled' };
  }

  if ((source.source_tier ?? 'direct_ats') !== 'direct_ats') {
    return { inserted: 0, matched: 0, fetched: 0, error: 'Only direct ATS sources can be refreshed right now' };
  }

  if (!source.ats_type || !source.ats_board_token) {
    return { inserted: 0, matched: 0, fetched: 0, error: 'Radar source is missing ATS configuration' };
  }

  let postings: NormalizedPosting[];
  try {
    postings = await getAtsAdapter(source.ats_type).fetch(source.ats_board_token);
  } catch (error) {
    return {
      inserted: 0,
      matched: 0,
      fetched: 0,
      error: error instanceof Error ? error.message : 'Failed to refresh radar source',
    };
  }

  let result: RefreshResult = { inserted: 0, matched: 0, fetched: postings.length, error: null };
  let matchedCount = 0;

  try {
    const criteria = await getRadarCriteria(db, source.user_id);
    matchedCount = postings.filter((posting) => matches(posting, criteria)).length;
    result = await ingestRadarPostings(db, source, postings, criteria);
    await updateLastRefreshedAt(db, source.id);
  } catch (error) {
    return {
      inserted: result.inserted,
      matched: result.matched || matchedCount,
      fetched: postings.length,
      error: error instanceof Error ? error.message : 'Failed to refresh radar source',
    };
  }

  return result;
}
