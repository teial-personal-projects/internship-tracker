import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { sanitizeJobInput } from '../lib/sanitize';
import { CreateJobSchema, UpdateJobSchema } from '@internship-tracker/shared';
import type { Request } from 'express';

const router = Router();

// GET /api/jobs
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const { data, error } = await db
      .from('jobs')
      .select('*')
      .order('added', { ascending: false });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post('/', requireAuth, validateBody(CreateJobSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const payload = sanitizeJobInput({ ...req.body, user_id: user.id });

    const { data, error } = await db.from('jobs').insert(payload).select().single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id
router.patch('/:id', requireAuth, validateBody(UpdateJobSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const { id } = req.params;

    // Strip fields that should never be patched directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, created_at, ...rest } = req.body as Record<string, unknown>;
    const payload = sanitizeJobInput(rest);

    const { data, error } = await db
      .from('jobs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const { id } = req.params;

    const { error } = await db.from('jobs').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
