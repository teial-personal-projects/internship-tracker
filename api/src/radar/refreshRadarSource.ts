import type { AtsType } from '@internship-tracker/shared';
import type { RadarCriteria } from '@internship-tracker/shared';
import type { NormalizedPosting } from './adapters/types';
import { getAtsAdapter } from './adapters/registry';
import { criteriaFromRow, matches } from './match';

type RadarSourceRow = {
  id: string;
  user_id: string;
  company_name: string;
  ats_type: AtsType | null;
  ats_board_token: string | null;
  radar_enabled: boolean;
};

type DbResult<T> = Promise<{ data: T; error: { message: string } | null }>;

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

function toQuery<T>(value: unknown): T {
  return value as T;
}

async function getExistingPostingIds(
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
      query.select('user_id, include_keywords, exclude_keywords, seniority_terms, location_rules, created_at, updated_at'),
    ).eq('user_id', userId),
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return criteriaFromRow(result.data?.[0] ?? null);
}

async function insertPosting(
  db: RadarRefreshDb,
  source: RadarSourceRow,
  posting: NormalizedPosting,
): Promise<void> {
  const query = toQuery<{
    insert(payload: Record<string, unknown>): unknown;
  }>(db.from('discovered_postings'));

  const result = await toQuery<Promise<{ data: unknown; error: { message: string } | null }>>(
    query.insert({
      user_id: source.user_id,
      watchlist_id: source.id,
      company_name: source.company_name,
      external_job_id: posting.externalId,
      title: posting.title,
      location: posting.location,
      remote_status: posting.remoteStatus,
      url: posting.url,
      posted_at: posting.postedAt,
      status: 'new',
      raw_payload: posting.raw,
    }),
  );

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

export async function refreshRadarSource(
  db: RadarRefreshDb,
  source: RadarSourceRow,
): Promise<RefreshResult> {
  if (!source.radar_enabled) {
    return { inserted: 0, matched: 0, fetched: 0, error: 'Radar source is not enabled' };
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

  const criteria = await getRadarCriteria(db, source.user_id);
  const matchedPostings = postings.filter((posting) => matches(posting, criteria));
  const existingIds = await getExistingPostingIds(db, source.id);
  let inserted = 0;

  for (const posting of matchedPostings) {
    if (existingIds.has(posting.externalId)) continue;
    await insertPosting(db, source, posting);
    existingIds.add(posting.externalId);
    inserted += 1;
  }

  await updateLastRefreshedAt(db, source.id);

  return {
    inserted,
    matched: matchedPostings.length,
    fetched: postings.length,
    error: null,
  };
}
