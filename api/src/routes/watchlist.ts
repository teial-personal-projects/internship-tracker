import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { sanitizeWatchlistInput } from '../lib/sanitize';
import {
  CreateCompanyWatchlistEntrySchema,
  UpdateCompanyWatchlistEntrySchema,
} from '@internship-tracker/shared';
import type { Request, Response } from 'express';

const router = Router();

type Ownership = 'ok' | 'not_found' | 'forbidden';

const PROMOTED_APPLICATION_TITLE = 'General application';

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function getOwnedWatchlistEntry(
  db: ReturnType<typeof createUserClient>,
  entryId: string,
  userId: string,
) {
  const { data, error } = await db
    .from('company_watchlist')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error || !data) return { entry: null, ownership: 'not_found' as const };
  if ((data as { user_id: string }).user_id !== userId) {
    return { entry: data, ownership: 'forbidden' as const };
  }
  return { entry: data, ownership: 'ok' as const };
}

function sendWatchlistOwnershipError(
  res: Response,
  ownership: Exclude<Ownership, 'ok'>,
): void {
  if (ownership === 'forbidden') {
    res.status(403).json({ error: 'Watchlist entry does not belong to current user' });
    return;
  }
  res.status(404).json({ error: 'Watchlist entry not found' });
}

// GET /api/watchlist
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const search = queryString(req.query.search);
    const priority = queryString(req.query.priority);
    const targetApplyDateFrom = queryString(req.query.target_apply_date_from);
    const targetApplyDateTo = queryString(req.query.target_apply_date_to);

    let query = db
      .from('company_watchlist')
      .select('*')
      .order('added', { ascending: false });

    if (search) {
      query = query.ilike('company_name', `%${search}%`);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (targetApplyDateFrom) {
      query = query.gte('target_apply_date', targetApplyDateFrom);
    }
    if (targetApplyDateTo) {
      query = query.lte('target_apply_date', targetApplyDateTo);
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

// POST /api/watchlist
router.post('/', requireAuth, validateBody(CreateCompanyWatchlistEntrySchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const body = req.body as z.infer<typeof CreateCompanyWatchlistEntrySchema>;
    const payload = sanitizeWatchlistInput({ ...body, user_id: user.id });

    const { data, error } = await db
      .from('company_watchlist')
      .insert(payload)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/watchlist/:id
router.get('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { entry, ownership } = await getOwnedWatchlistEntry(db, req.params.id, user.id);

    if (ownership !== 'ok') {
      sendWatchlistOwnershipError(res, ownership);
      return;
    }

    res.json({ data: entry });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/watchlist/:id
router.patch('/:id', requireAuth, validateBody(UpdateCompanyWatchlistEntrySchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    const ownership = await getOwnedWatchlistEntry(db, id, user.id);

    if (ownership.ownership !== 'ok') {
      sendWatchlistOwnershipError(res, ownership.ownership);
      return;
    }

    const payload = sanitizeWatchlistInput(req.body as Record<string, unknown>);
    const { data, error } = await db
      .from('company_watchlist')
      .update(payload)
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

// DELETE /api/watchlist/:id
router.delete('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    const { ownership } = await getOwnedWatchlistEntry(db, id, user.id);

    if (ownership !== 'ok') {
      sendWatchlistOwnershipError(res, ownership);
      return;
    }

    const { error } = await db
      .from('company_watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/watchlist/:id/promote
router.post('/:id/promote', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    const { entry, ownership } = await getOwnedWatchlistEntry(db, id, user.id);

    if (ownership !== 'ok') {
      sendWatchlistOwnershipError(res, ownership);
      return;
    }

    const watchlistEntry = entry as {
      company_name: string;
      industry?: string | null;
    };

    const { data: application, error: applicationError } = await db
      .from('applications')
      .insert({
        user_id: user.id,
        company: watchlistEntry.company_name,
        title: PROMOTED_APPLICATION_TITLE,
        industry: watchlistEntry.industry ?? null,
        status: 'not_started',
        application_type: 'cold_strategic',
        checklist_state: {},
        source: 'watchlist',
        source_metadata: { watchlist_id: id },
      })
      .select('id')
      .single();

    if (applicationError || !application) {
      res.status(500).json({ error: applicationError?.message ?? 'Failed to create application' });
      return;
    }

    const { error: deleteError } = await db
      .from('company_watchlist')
      .delete()
      .eq('id', id);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.status(201).json({ data: { application_id: (application as { id: string }).id } });
  } catch (err) {
    next(err);
  }
});

export default router;
