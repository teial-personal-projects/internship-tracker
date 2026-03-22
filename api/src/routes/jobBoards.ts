import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createUserClient } from '../lib/supabase';
import type { Request } from 'express';

const router = Router();

// GET /api/job-boards
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);

    const { data, error } = await db
      .from('job_boards')
      .select('*')
      .order('sort_order', { ascending: true });

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
