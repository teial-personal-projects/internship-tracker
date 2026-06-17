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

    if (req.query.status) {
      query = query.eq('status', req.query.status as string);
    }
    if (req.query.watchlist_id) {
      query = query.eq('watchlist_id', req.query.watchlist_id as string);
    }
    if (req.query.search) {
      query = query.ilike('title', `%${req.query.search as string}%`);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: data ?? [] });
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

// POST /api/radar/postings/:id/promote
router.post('/postings/:id/promote', requireAuth, async (req: Request, res, next) => {
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
      company_name: string;
      title: string;
      url: string;
      status: string;
    };

    if (p.status === 'promoted') {
      res.status(409).json({ error: 'Posting has already been promoted' });
      return;
    }

    const { data: application, error: applicationError } = await db
      .from('applications')
      .insert({
        user_id: user.id,
        company: p.company_name,
        title: p.title,
        job_link: p.url,
        status: 'not_started',
        checklist_state: {},
        applied_date: null,
        source: 'radar',
        source_metadata: { discovered_posting_id: id },
      })
      .select('id')
      .single();

    if (applicationError || !application) {
      res.status(500).json({ error: applicationError?.message ?? 'Failed to create application' });
      return;
    }

    const { error: updateError } = await db
      .from('discovered_postings')
      .update({ status: 'promoted' })
      .eq('id', id);

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    res.status(201).json({ data: { application_id: (application as { id: string }).id } });
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
      .select('id, user_id, company_name, ats_type, ats_board_token, radar_enabled')
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
    };

    const result = await refreshRadarSource(db as unknown as RadarRefreshDb, source);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ data: { inserted: result.inserted, matched: result.matched, fetched: result.fetched } });
  } catch (err) {
    next(err);
  }
});

export default router;
