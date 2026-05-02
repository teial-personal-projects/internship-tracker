import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { sanitizeApplicationInput } from '../lib/sanitize';
import { CreateApplicationSchema, UpdateApplicationSchema } from '@internship-tracker/shared';
import type { Request } from 'express';

const router = Router();

const PAGE_MAX = 100;

// GET /api/applications
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(PAGE_MAX, Math.max(1, Number(req.query.limit) || 25));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = db
      .from('applications')
      .select('*', { count: 'exact' })
      .order('added', { ascending: false });

    if (req.query.status) {
      query = query.eq('status', req.query.status as string);
    }
    if (req.query.application_type) {
      query = query.eq('application_type', req.query.application_type as string);
    }
    if (req.query.search) {
      query = query.ilike('company', `%${req.query.search}%`);
    }
    if (req.query.date_from) {
      query = query.gte('applied_date', req.query.date_from as string);
    }
    if (req.query.date_to) {
      query = query.lte('applied_date', req.query.date_to as string);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const total = count ?? 0;
    res.json({
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications
router.post('/', requireAuth, validateBody(CreateApplicationSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const payload = sanitizeApplicationInput({ ...req.body, user_id: user.id });

    const { data, error } = await db.from('applications').insert(payload).select().single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id
router.get('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const { id } = req.params;

    const { data, error } = await db
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id
router.patch('/:id', requireAuth, validateBody(UpdateApplicationSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const { id } = req.params;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, created_at, updated_at, ...rest } = req.body as Record<string, unknown>;
    const payload = sanitizeApplicationInput(rest);

    const { data, error } = await db
      .from('applications')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id
router.delete('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const { id } = req.params;

    // Count related records before cascade delete
    const [{ count: contactCount }, { count: taskCount }, { count: interviewCount }] =
      await Promise.all([
        db.from('application_contacts').select('*', { count: 'exact', head: true }).eq('application_id', id),
        db.from('tasks').select('*', { count: 'exact', head: true }).eq('application_id', id),
        db.from('interviews').select('*', { count: 'exact', head: true }).eq('application_id', id),
      ]);

    const cascaded = (contactCount ?? 0) + (taskCount ?? 0) + (interviewCount ?? 0) > 0;

    const { error } = await db.from('applications').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ data: null, cascaded });
  } catch (err) {
    next(err);
  }
});

export default router;
