import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { refreshRadarSource, type RadarRefreshDb } from '../radar/refreshRadarSource';
import { validatePostingFromSource, type RadarValidationDb } from '../radar/validatePosting';
import { qualityScore } from '../radar/qualityScore';
import { UpdateRadarCriteriaSchema, type AtsType, type RadarCriteria, type UpdateRadarCriteriaSchemaType } from '@internship-tracker/shared';
import type { Request, Response } from 'express';

const router = Router();

type Ownership = 'ok' | 'not_found' | 'forbidden';
type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';
type ValidityStatus = 'unchecked' | 'live' | 'closed' | 'not_found' | 'stale' | 'error';
type RadarSort = 'quality' | 'first_seen' | 'posted_at';
type SearchablePosting = {
  title?: string | null;
  company_name?: string | null;
  location?: string | null;
  watchlist_id?: string | null;
};
type RadarPostingRow = SearchablePosting & {
  source_tier?: SourceTier | null;
  validity_status?: ValidityStatus | null;
  first_seen_at?: string | null;
  posted_at?: string | null;
  last_validated_at?: string | null;
  also_seen_on?: unknown;
};
type SearchableWatchlistEntry = {
  id: string;
  company_name?: string | null;
  industry?: string | null;
};

const UpdatePostingStatusSchema = z.object({
  status: z.enum(['seen', 'dismissed']),
});

const DEFAULT_RADAR_CRITERIA = {
  title_terms: ['software engineer', 'backend engineer', 'full-stack engineer', 'full stack engineer'],
  field_terms: ['edtech', 'education technology', 'mission-driven', 'civic tech', 'nonprofit tech'],
  include_keywords: [],
  exclude_keywords: ['junior', 'intern', 'internship'],
  seniority_terms: [],
  location_rules: ['remote_us', 'la'],
} satisfies UpdateRadarCriteriaSchemaType;

function normalizeTerms(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(value
    .filter((term): term is string => typeof term === 'string')
    .map((term) => term.trim())
    .filter(Boolean))]
    .slice(0, 25);
}

function normalizeLocationRules(value: unknown): RadarCriteria['location_rules'] {
  if (!Array.isArray(value)) return DEFAULT_RADAR_CRITERIA.location_rules;

  const allowed = new Set(['remote_us', 'la', 'onsite', 'unknown']);
  const rules = value.filter((rule): rule is RadarCriteria['location_rules'][number] =>
    typeof rule === 'string' && allowed.has(rule),
  );
  return rules.length > 0 ? rules : DEFAULT_RADAR_CRITERIA.location_rules;
}

function criteriaPayloadFromBody(body: UpdateRadarCriteriaSchemaType): UpdateRadarCriteriaSchemaType {
  return {
    title_terms: normalizeTerms(body.title_terms),
    field_terms: normalizeTerms(body.field_terms),
    include_keywords: normalizeTerms(body.include_keywords),
    exclude_keywords: normalizeTerms(body.exclude_keywords),
    seniority_terms: normalizeTerms(body.seniority_terms),
    location_rules: normalizeLocationRules(body.location_rules),
  };
}

function defaultCriteria(userId: string): RadarCriteria {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    ...DEFAULT_RADAR_CRITERIA,
    created_at: now,
    updated_at: now,
  };
}

function criteriaFromRow(row: Partial<RadarCriteria> | null | undefined, userId: string): RadarCriteria {
  const defaults = defaultCriteria(userId);
  if (!row) return defaults;

  return {
    ...defaults,
    ...row,
    user_id: userId,
    title_terms: normalizeTerms(row.title_terms).length > 0 ? normalizeTerms(row.title_terms) : defaults.title_terms,
    field_terms: normalizeTerms(row.field_terms).length > 0 ? normalizeTerms(row.field_terms) : defaults.field_terms,
    include_keywords: normalizeTerms(row.include_keywords),
    exclude_keywords: normalizeTerms(row.exclude_keywords).length > 0 ? normalizeTerms(row.exclude_keywords) : defaults.exclude_keywords,
    seniority_terms: normalizeTerms(row.seniority_terms),
    location_rules: normalizeLocationRules(row.location_rules),
    created_at: row.created_at ?? defaults.created_at,
    updated_at: row.updated_at ?? defaults.updated_at,
  };
}

async function getRadarCriteriaRow(
  db: ReturnType<typeof createUserClient>,
  userId: string,
): Promise<RadarCriteria> {
  const { data, error } = await db
    .from('radar_criteria')
    .select('user_id, title_terms, field_terms, include_keywords, exclude_keywords, seniority_terms, location_rules, created_at, updated_at')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('radar_criteria') && (message.includes('schema') || message.includes('does not exist'))) {
      return defaultCriteria(userId);
    }
    throw new Error(error.message);
  }
  return criteriaFromRow((data as Partial<RadarCriteria>[] | null)?.[0] ?? null, userId);
}

async function getOwnedPosting(
  db: ReturnType<typeof createUserClient>,
  postingId: string,
  userId: string,
) {
  const { data, error } = await db
    .from('discovered_postings')
    .select('*')
    .eq('id', postingId)
    .single();

  if (error || !data) return { posting: null, ownership: 'not_found' as const };
  if ((data as { user_id: string }).user_id !== userId) {
    return { posting: data, ownership: 'forbidden' as const };
  }
  return { posting: data, ownership: 'ok' as const };
}

function sendOwnershipError(res: Response, ownership: Exclude<Ownership, 'ok'>): void {
  if (ownership === 'forbidden') {
    res.status(403).json({ error: 'Posting does not belong to current user' });
    return;
  }
  res.status(404).json({ error: 'Posting not found' });
}

async function validatePostingForExplicitAction(
  db: ReturnType<typeof createUserClient>,
  posting: Record<string, unknown>,
): Promise<void> {
  await validatePostingFromSource(db as unknown as RadarValidationDb, posting as unknown as Parameters<typeof validatePostingFromSource>[1]);
}

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseSourceTier(value: unknown): SourceTier | undefined {
  const raw = queryString(value);
  return raw === 'direct_ats' || raw === 'curated_board' || raw === 'aggregator' ? raw : undefined;
}

function parseValidityStatus(value: unknown): ValidityStatus | undefined {
  const raw = queryString(value);
  return raw === 'unchecked'
    || raw === 'live'
    || raw === 'closed'
    || raw === 'not_found'
    || raw === 'stale'
    || raw === 'error' ? raw : undefined;
}

function parseSort(value: unknown, status: string | undefined): RadarSort {
  const raw = queryString(value);
  if (raw === 'quality' || raw === 'first_seen' || raw === 'posted_at') return raw;
  return status === 'new' ? 'quality' : 'first_seen';
}

function queryBoolean(value: unknown): boolean {
  return value === 'true';
}

function containsSearchValue(value: string | null | undefined, search: string): boolean {
  return typeof value === 'string' && value.toLowerCase().includes(search);
}

function postingMatchesSearch(
  posting: SearchablePosting,
  search: string,
  matchingWatchlistIds: Set<string>,
): boolean {
  return containsSearchValue(posting.title, search)
    || containsSearchValue(posting.company_name, search)
    || containsSearchValue(posting.location, search)
    || Boolean(posting.watchlist_id && matchingWatchlistIds.has(posting.watchlist_id));
}

function timestampValue(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isClosedPosting(posting: RadarPostingRow): boolean {
  return posting.validity_status === 'closed' || posting.validity_status === 'not_found';
}

function isOldClosedPosting(posting: RadarPostingRow): boolean {
  if (!isClosedPosting(posting)) return false;
  const lastValidatedAt = timestampValue(posting.last_validated_at);
  if (lastValidatedAt === 0) return false;
  return Date.now() - lastValidatedAt > 14 * 86_400_000;
}

function filterRadarPostings(
  postings: RadarPostingRow[],
  filters: {
    sourceTier?: SourceTier;
    validityStatus?: ValidityStatus;
    includeClosed: boolean;
    search?: string;
    matchingWatchlistIds: Set<string>;
  },
): RadarPostingRow[] {
  return postings.filter((posting) => {
    if (filters.sourceTier && (posting.source_tier ?? 'direct_ats') !== filters.sourceTier) return false;
    if (filters.validityStatus && (posting.validity_status ?? 'unchecked') !== filters.validityStatus) return false;
    if (!filters.validityStatus && filters.sourceTier === 'direct_ats' && isClosedPosting(posting)) return false;
    if (!filters.validityStatus && !filters.includeClosed && isOldClosedPosting(posting)) return false;
    if (filters.search && !postingMatchesSearch(posting, filters.search, filters.matchingWatchlistIds)) return false;
    return true;
  });
}

function sortRadarPostings(postings: RadarPostingRow[], sort: RadarSort): RadarPostingRow[] {
  return [...postings].sort((left, right) => {
    if (sort === 'quality') {
      const qualityDiff = qualityScore(right) - qualityScore(left);
      if (qualityDiff !== 0) return qualityDiff;
    }

    const dateField = sort === 'posted_at' ? 'posted_at' : 'first_seen_at';
    const dateDiff = timestampValue(right[dateField]) - timestampValue(left[dateField]);
    if (dateDiff !== 0) return dateDiff;

    return timestampValue(right.first_seen_at) - timestampValue(left.first_seen_at);
  });
}

async function getSearchMatchingWatchlistIds(
  db: ReturnType<typeof createUserClient>,
  userId: string,
  search: string,
): Promise<Set<string>> {
  const { data, error } = await db
    .from('company_watchlist')
    .select('id, company_name, industry')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data as SearchableWatchlistEntry[] | null ?? [])
    .filter((entry) =>
      containsSearchValue(entry.company_name, search)
      || containsSearchValue(entry.industry, search),
    )
    .map((entry) => entry.id));
}

// GET /api/radar/criteria
router.get('/criteria', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const criteria = await getRadarCriteriaRow(db, user.id);

    res.json({ data: criteria });
  } catch (err) {
    next(err);
  }
});

// PUT /api/radar/criteria
router.put('/criteria', requireAuth, validateBody(UpdateRadarCriteriaSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const payload = criteriaPayloadFromBody(req.body as UpdateRadarCriteriaSchemaType);

    const { data: existingCriteria, error: existingError } = await db
      .from('radar_criteria')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingError) {
      res.status(500).json({ error: existingError.message });
      return;
    }

    const query = existingCriteria?.[0]
      ? db.from('radar_criteria').update(payload).eq('user_id', user.id)
      : db.from('radar_criteria').insert({ user_id: user.id, ...payload });

    const { data, error } = await query
      .select('user_id, title_terms, field_terms, include_keywords, exclude_keywords, seniority_terms, location_rules, created_at, updated_at')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: criteriaFromRow(data as Partial<RadarCriteria> | null, user.id) });
  } catch (err) {
    next(err);
  }
});

// POST /api/radar/search
router.post('/search', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const criteria = await getRadarCriteriaRow(db, user.id);

    res.json({
      data: {
        sources_searched: 0,
        fetched: 0,
        matched: 0,
        inserted: 0,
        criteria,
        message: 'Trusted source search is ready for manual use; source adapters are added in Step 10.',
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/radar/postings
router.get('/postings', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;

    let query = db
      .from('discovered_postings')
      .select('*')
      .eq('user_id', user.id)
      .order('first_seen_at', { ascending: false });

    const status = queryString(req.query.status);
    const watchlistId = queryString(req.query.watchlist_id);
    const search = queryString(req.query.search)?.toLowerCase();
    const sourceTier = parseSourceTier(req.query.source_tier);
    const validityStatus = parseValidityStatus(req.query.validity_status);
    const sort = parseSort(req.query.sort, status);
    const includeClosed = queryBoolean(req.query.include_closed);

    if (status) {
      query = query.eq('status', status);
    }
    if (watchlistId) {
      query = query.eq('watchlist_id', watchlistId);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const matchingWatchlistIds = search
      ? await getSearchMatchingWatchlistIds(db, user.id, search)
      : new Set<string>();
    const filteredData = filterRadarPostings(data as RadarPostingRow[] | null ?? [], {
      sourceTier,
      validityStatus,
      includeClosed,
      search,
      matchingWatchlistIds,
    });

    res.json({ data: sortRadarPostings(filteredData, sort) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/radar/postings/:id
router.patch('/postings/:id', requireAuth, validateBody(UpdatePostingStatusSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { posting, ownership } = await getOwnedPosting(db, id, user.id);

    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const currentStatus = (posting as { status: string }).status;
    if (currentStatus === 'promoted') {
      res.status(409).json({ error: 'Cannot update status of a promoted posting' });
      return;
    }

    await validatePostingForExplicitAction(db, posting as Record<string, unknown>);

    const { data, error } = await db
      .from('discovered_postings')
      .update({ status: req.body.status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/radar/postings/:id/save-company
router.post('/postings/:id/save-company', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { posting, ownership } = await getOwnedPosting(db, id, user.id);

    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const p = posting as {
      watchlist_id?: string;
      company_name: string;
      source_tier?: SourceTier;
      first_seen_source?: string | null;
    };

    await validatePostingForExplicitAction(db, posting as Record<string, unknown>);

    const { data: existingEntries, error: existingError } = await db
      .from('company_watchlist')
      .select('*')
      .eq('user_id', user.id)
      .ilike('company_name', p.company_name)
      .limit(1);

    if (existingError) {
      res.status(500).json({ error: existingError.message });
      return;
    }

    const existingEntry = existingEntries?.[0] ?? null;
    if (existingEntry) {
      res.json({ data: { watchlist_entry: existingEntry, created: false } });
      return;
    }

    const sourceName = p.first_seen_source && p.first_seen_source !== 'radar'
      ? p.first_seen_source
      : null;

    const { data: sourceEntry } = p.watchlist_id ? await db
      .from('company_watchlist')
      .select('ats_type, ats_board_token, source_name')
      .eq('id', p.watchlist_id)
      .single() : { data: null };

    const sourceContext = sourceEntry as {
      ats_type?: AtsType | null;
      ats_board_token?: string | null;
      source_name?: string | null;
    } | null;

    const { data: watchlistEntry, error: watchlistError } = await db
      .from('company_watchlist')
      .insert({
        user_id: user.id,
        company_name: p.company_name,
        added: new Date().toISOString().slice(0, 10),
        radar_enabled: false,
        source_tier: p.source_tier ?? 'direct_ats',
        source_name: sourceName ?? sourceContext?.source_name ?? null,
        ats_type: sourceContext?.ats_type ?? null,
        ats_board_token: sourceContext?.ats_board_token ?? null,
      })
      .select()
      .single();

    if (watchlistError || !watchlistEntry) {
      res.status(500).json({ error: watchlistError?.message ?? 'Failed to save company' });
      return;
    }

    res.status(201).json({ data: { watchlist_entry: watchlistEntry, created: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/radar/sources/:watchlistId/refresh
router.post('/sources/:watchlistId/refresh', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { watchlistId } = req.params;

    const { data: entry, error: entryError } = await db
      .from('company_watchlist')
      .select('id, user_id, company_name, ats_type, ats_board_token, radar_enabled, source_tier, source_name')
      .eq('id', watchlistId)
      .single();

    if (entryError || !entry) {
      res.status(404).json({ error: 'Watchlist entry not found' });
      return;
    }

    if ((entry as { user_id: string }).user_id !== user.id) {
      res.status(403).json({ error: 'Watchlist entry does not belong to current user' });
      return;
    }

    const source = entry as {
      id: string;
      user_id: string;
      company_name: string;
      ats_type: AtsType | null;
      ats_board_token: string | null;
      radar_enabled: boolean;
      source_tier: SourceTier;
      source_name: string | null;
    };

    const result = await refreshRadarSource(db as unknown as RadarRefreshDb, source);

    res.json({
      data: {
        inserted: result.inserted,
        matched: result.matched,
        fetched: result.fetched,
        error: result.error,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
