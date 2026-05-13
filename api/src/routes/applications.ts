import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { sanitizeApplicationInput } from '../lib/sanitize';
import { recalculateChecklist } from '../lib/checklist';
import { computePageRange, computeTotalPages } from '../lib/pagination';
import { applyApplicationFilters } from '../lib/applicationFilters';
import { createApplicationDoubleDownTask } from '../services/taskAutoGeneration';
import { CreateApplicationEventSchema, CreateApplicationSchema, UpdateApplicationSchema } from '@internship-tracker/shared';
import type { Request, Response } from 'express';

const router = Router();

const PAGE_MAX = 100;

interface ApplicationTaskTriggerState {
  status?: string | null;
  application_type?: string | null;
  checklist_state?: unknown;
}

// GET /api/applications
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(PAGE_MAX, Math.max(1, Number(req.query.limit) || 25));
    const { from, to } = computePageRange(page, limit);

    const baseQuery = db
      .from('applications')
      .select('*', { count: 'exact' })
      .order('added', { ascending: false });

    const query = applyApplicationFilters(baseQuery, {
      status:           req.query.status as string | undefined,
      application_type: req.query.application_type as string | undefined,
      search:           req.query.search as string | undefined,
      date_from:        req.query.date_from as string | undefined,
      date_to:          req.query.date_to as string | undefined,
    });

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
      totalPages: computeTotalPages(total, limit),
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

    if (data?.status === 'applied' && data?.application_type === 'cold_strategic') {
      const { error: taskError } = await createApplicationDoubleDownTask(db, data.id, user.id);
      if (taskError) {
        res.status(500).json({ error: taskError.message });
        return;
      }
    }

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/stats — must appear before /:id to avoid "stats" being parsed as an id
router.get('/stats', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);

    const { data, error } = await db
      .from('applications')
      .select('status, application_type');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // unset_type_count: total across all pages, for the prompt banner in the Applications tab
    const status_counts: Record<string, number> = {};
    let unset_type_count = 0;
    for (const row of data ?? []) {
      const app = row as { status: string; application_type: string | null };
      const s = app.status;
      status_counts[s] = (status_counts[s] ?? 0) + 1;
      if (!app.application_type) {
        unset_type_count += 1;
      }
    }

    res.json({ status_counts, unset_type_count });
  } catch (err) {
    next(err);
  }
});

async function verifyApplicationOwnership(
  db: ReturnType<typeof createUserClient>,
  applicationId: string,
  userId: string,
): Promise<'ok' | 'not_found' | 'forbidden'> {
  const { data, error } = await db
    .from('applications')
    .select('id, user_id')
    .eq('id', applicationId)
    .single();

  if (error || !data) {
    return 'not_found';
  }

  return (data as { user_id: string }).user_id === userId ? 'ok' : 'forbidden';
}

function sendOwnershipError(
  res: Response,
  ownership: 'not_found' | 'forbidden',
): void {
  if (ownership === 'forbidden') {
    res.status(403).json({ error: 'Application does not belong to current user' });
    return;
  }
  res.status(404).json({ error: 'Application not found' });
}

// GET /api/applications/:id/events
router.get('/:id/events', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const ownership = await verifyApplicationOwnership(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { data, error } = await db
      .from('application_events')
      .select('*, contacts(first_name, last_name)')
      .eq('application_id', id)
      .order('occurred_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications/:id/events
router.post('/:id/events', requireAuth, validateBody(CreateApplicationEventSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const ownership = await verifyApplicationOwnership(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const body = req.body as {
      event_type: string;
      body?: string | null;
      contact_id?: string | null;
      occurred_at?: string;
    };

    if (body.contact_id) {
      const { data: contact, error: contactError } = await db
        .from('contacts')
        .select('id, user_id')
        .eq('id', body.contact_id)
        .single();

      if (contactError || !contact || (contact as { user_id: string }).user_id !== user.id) {
        res.status(400).json({ error: 'Contact does not belong to current user' });
        return;
      }
    }

    const payload = {
      ...body,
      application_id: id,
      user_id: user.id,
      occurred_at: body.occurred_at ?? new Date().toISOString(),
    };

    const { data, error } = await db
      .from('application_events')
      .insert(payload)
      .select('*, contacts(first_name, last_name)')
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

// POST /api/applications/:id/contacts
router.post('/:id/contacts', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    const contactId = (req.body as { contact_id?: string }).contact_id;

    if (!contactId) {
      res.status(400).json({ error: 'contact_id is required' });
      return;
    }

    const ownership = await verifyApplicationOwnership(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { data: contact, error: contactError } = await db
      .from('contacts')
      .select('id, user_id, contact_type')
      .eq('id', contactId)
      .single();

    if (contactError || !contact || (contact as { user_id: string }).user_id !== user.id) {
      res.status(400).json({ error: 'Contact does not belong to current user' });
      return;
    }

    if ((contact as { contact_type: string }).contact_type !== 'recruiter') {
      res.status(400).json({ error: 'Only recruiter contacts can be linked to applications' });
      return;
    }

    const { data, error } = await db
      .from('application_contacts')
      .insert({ application_id: id, contact_id: contactId, user_id: user.id })
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

// DELETE /api/applications/:id/contacts/:cid
router.delete('/:id/contacts/:cid', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id, cid } = req.params;

    const ownership = await verifyApplicationOwnership(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { error } = await db
      .from('application_contacts')
      .delete()
      .eq('application_id', id)
      .eq('contact_id', cid)
      .eq('user_id', user.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: null });
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
    let payload = sanitizeApplicationInput(rest);

    let currentApplication: ApplicationTaskTriggerState | null = null;

    if ('application_type' in rest || 'status' in rest) {
      const { data: current } = await db
        .from('applications')
        .select('status, application_type, checklist_state')
        .eq('id', id)
        .single();

      currentApplication = current as ApplicationTaskTriggerState | null;
      const newType = (rest.application_type as string | null) ?? null;
      const oldType = (current?.application_type as string | null) ?? null;

      if ('application_type' in rest && current && newType !== oldType) {
        payload = {
          ...payload,
          checklist_state: recalculateChecklist(
            (current.checklist_state ?? {}) as Record<string, boolean>,
            newType,
          ),
        };
        const { error: taskError } = await db.from('tasks').update({ status: 'skipped' })
          .eq('application_id', id)
          .eq('is_auto_generated', true)
          .eq('status', 'open');

        if (taskError) {
          res.status(500).json({ error: taskError.message });
          return;
        }
      }
    }

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

    const wasApplied = currentApplication?.status === 'applied';
    const isApplied = data.status === 'applied';
    const isColdStrategic = data.application_type === 'cold_strategic';
    const becameApplied = 'status' in rest && !wasApplied && isApplied;
    const becameColdApplied = 'application_type' in rest
      && currentApplication?.application_type !== 'cold_strategic'
      && isApplied
      && isColdStrategic;

    if (isColdStrategic && (becameApplied || becameColdApplied)) {
      const { error: taskError } = await createApplicationDoubleDownTask(db, data.id, (req as AuthRequest).user.id);
      if (taskError) {
        res.status(500).json({ error: taskError.message });
        return;
      }
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
