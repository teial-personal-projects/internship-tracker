import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { UpdateProfileSchema } from '@internship-tracker/shared';
import type { Request } from 'express';

const router = Router();

// GET /api/profile
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;

    const { data, error } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      res.status(500).json({ error: error.message });
      return;
    }

    // If no profile yet, return empty defaults
    res.json({
      data: data ?? { user_id: user.id, major: null, positions: [], locations: [] },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile
router.put('/', requireAuth, validateBody(UpdateProfileSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;

    const { data, error } = await db
      .from('user_profiles')
      .upsert({ user_id: user.id, ...req.body })
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

export default router;
