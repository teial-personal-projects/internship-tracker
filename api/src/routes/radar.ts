import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { refreshRadarSource, type RadarRefreshDb } from '../radar/refreshRadarSource';
import type { AtsType } from '@internship-tracker/shared';
import type { Request, Response } from 'express';

const router = Router();

type Ownership = 'ok' | 'not_found' | 'forbidden';
type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';
type SearchablePosting = {
  title?: string | null;
  company_name?: string | null;
  location?: string | null;
  watchlist_id?: string | null;
};
type SearchableWatchlistEntry = {
  id: string;
  company_name?: string | null;
  industry?: string | null;
};

const UpdatePostingStatusSchema = z.object({
  status: z.enum(['seen', 'dismissed']),
});

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

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
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

    if (!search) {
      res.json({ data: data ?? [] });
      return;
    }

    const matchingWatchlistIds = await getSearchMatchingWatchlistIds(db, user.id, search);
    const filteredData = (data as SearchablePosting[] | null ?? [])
      .filter((posting) => postingMatchesSearch(posting, search, matchingWatchlistIds));

    res.json({ data: filteredData });
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
