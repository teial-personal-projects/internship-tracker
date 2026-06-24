import type { AtsType } from '@internship-tracker/shared';
import type { NormalizedPosting, PostingValidationResult } from './adapters/types';
import { getAtsAdapter } from './adapters/registry';

type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';
type ValidityStatus = PostingValidationResult['status'];
const VALIDATION_FRESH_MS = 60 * 60 * 1000;

type DbResult<T> = Promise<{ data: T; error: { message: string } | null }>;

export interface RadarValidationDb {
  from(table: string): {
    select(columns?: string): unknown;
    update?(payload: Record<string, unknown>): unknown;
    eq?(column: string, value: string): unknown;
    single?(): DbResult<Record<string, unknown> | null>;
  };
}

interface PostingRow {
  id: string;
  external_job_id: string;
  title: string;
  location: string | null;
  remote_status: NormalizedPosting['remoteStatus'] | null;
  url: string;
  posted_at: string | null;
  raw_payload: unknown;
  watchlist_id: string | null;
  source_tier?: SourceTier | null;
  validity_status?: ValidityStatus | 'unchecked' | 'stale' | null;
  last_validated_at?: string | null;
}

interface WatchlistSourceRow {
  ats_type: AtsType | null;
  ats_board_token: string | null;
}

export interface ValidatePostingResult {
  attempted: boolean;
  status: ValidityStatus | null;
  error: string | null;
}

function toQuery<T>(value: unknown): T {
  return value as T;
}

function rawObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizePosting(row: PostingRow): NormalizedPosting {
  const raw = rawObject(row.raw_payload);

  return {
    externalId: row.external_job_id,
    title: row.title,
    location: row.location,
    remoteStatus: row.remote_status ?? 'unknown',
    url: row.url,
    canonicalUrl: typeof raw.canonicalUrl === 'string' ? raw.canonicalUrl : undefined,
    companyDomain: typeof raw.companyDomain === 'string' ? raw.companyDomain : undefined,
    postedAt: row.posted_at,
    raw,
  };
}

function validationIsFresh(posting: PostingRow): boolean {
  if (!posting.last_validated_at || posting.validity_status === 'unchecked') return false;

  const timestamp = new Date(posting.last_validated_at).getTime();
  if (Number.isNaN(timestamp)) return false;

  return Date.now() - timestamp < VALIDATION_FRESH_MS;
}

function freshValidationStatus(posting: PostingRow): ValidityStatus | null {
  if (
    posting.validity_status === 'live'
    || posting.validity_status === 'closed'
    || posting.validity_status === 'not_found'
    || posting.validity_status === 'error'
  ) {
    return posting.validity_status;
  }

  return null;
}

async function getWatchlistSource(
  db: RadarValidationDb,
  watchlistId: string,
): Promise<WatchlistSourceRow | null> {
  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: string): unknown;
    single(): DbResult<Record<string, unknown> | null>;
  }>(db.from('company_watchlist'));

  const result = await toQuery<Promise<{ data: WatchlistSourceRow | null; error: { message: string } | null }>>(
    toQuery<{ single(): unknown }>(
      toQuery<{ eq(column: string, value: string): unknown }>(
        query.select('ats_type, ats_board_token'),
      ).eq('id', watchlistId),
    ).single(),
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

async function updatePostingValidation(
  db: RadarValidationDb,
  postingId: string,
  status: ValidityStatus,
  error: string | null,
): Promise<void> {
  const query = toQuery<{
    update(payload: Record<string, unknown>): {
      eq(column: string, value: string): DbResult<unknown>;
    };
  }>(db.from('discovered_postings'));

  const result = await query.update({
    validity_status: status,
    last_validated_at: new Date().toISOString(),
    validation_error: error,
  }).eq('id', postingId);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function validatePostingFromSource(
  db: RadarValidationDb,
  posting: PostingRow,
): Promise<ValidatePostingResult> {
  if (validationIsFresh(posting)) {
    return {
      attempted: false,
      status: freshValidationStatus(posting),
      error: null,
    };
  }

  if ((posting.source_tier ?? 'direct_ats') !== 'direct_ats' || !posting.watchlist_id) {
    return { attempted: false, status: null, error: null };
  }

  const source = await getWatchlistSource(db, posting.watchlist_id);
  if (!source?.ats_type || !source.ats_board_token) {
    return { attempted: false, status: null, error: null };
  }

  const adapter = getAtsAdapter(source.ats_type);
  if (!adapter.validate) {
    return { attempted: false, status: null, error: null };
  }

  const result = await adapter.validate({
    ...normalizePosting(posting),
    boardToken: source.ats_board_token,
  });

  await updatePostingValidation(db, posting.id, result.status, result.error ?? null);

  return {
    attempted: true,
    status: result.status,
    error: result.error ?? null,
  };
}
