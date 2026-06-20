import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { sanitizeTaskInput } from '../lib/sanitize';
import { CreateTaskSchema, UpdateTaskSchema } from '@internship-tracker/shared';
import type { Request, Response } from 'express';

const router = Router();
const UpdateTaskBodySchema = UpdateTaskSchema.pick({
  status: true,
  priority: true,
  due_date: true,
  notes: true,
});

type Ownership = 'ok' | 'not_found' | 'forbidden';

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function verifyLinkedRecordOwnership(
  db: ReturnType<typeof createUserClient>,
  table: 'applications' | 'contacts',
  id: string,
  userId: string,
): Promise<Ownership> {
  const { data, error } = await db
    .from(table)
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (error || !data) return 'not_found';
  return (data as { user_id: string }).user_id === userId ? 'ok' : 'forbidden';
}

async function getOwnedTask(
  db: ReturnType<typeof createUserClient>,
  taskId: string,
  userId: string,
) {
  const { data, error } = await db
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error || !data) return { task: null, ownership: 'not_found' as const };
  if ((data as { user_id: string }).user_id !== userId) {
    return { task: data, ownership: 'forbidden' as const };
  }
  return { task: data, ownership: 'ok' as const };
}

function sendTaskOwnershipError(res: Response, ownership: Exclude<Ownership, 'ok'>): void {
  if (ownership === 'forbidden') {
    res.status(403).json({ error: 'Task does not belong to current user' });
    return;
  }
  res.status(404).json({ error: 'Task not found' });
}

function sendLinkedOwnershipError(
  res: Response,
  resource: 'Application' | 'Contact',
  ownership: Exclude<Ownership, 'ok'>,
): void {
  if (ownership === 'forbidden') {
    res.status(400).json({ error: `${resource} does not belong to current user` });
    return;
  }
  res.status(400).json({ error: `${resource} not found` });
}

async function verifyTaskLinks(
  db: ReturnType<typeof createUserClient>,
  body: { application_id?: string | null; contact_id?: string | null },
  userId: string,
  res: Response,
): Promise<boolean> {
  if (body.application_id) {
    const ownership = await verifyLinkedRecordOwnership(db, 'applications', body.application_id, userId);
    if (ownership !== 'ok') {
      sendLinkedOwnershipError(res, 'Application', ownership);
      return false;
    }
  }

  if (body.contact_id) {
    const ownership = await verifyLinkedRecordOwnership(db, 'contacts', body.contact_id, userId);
    if (ownership !== 'ok') {
      sendLinkedOwnershipError(res, 'Contact', ownership);
      return false;
    }
  }

  return true;
}

// GET /api/tasks
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);

    let query = db
      .from('tasks')
      .select('*')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });

    const category = queryString(req.query.category);
    const priority = queryString(req.query.priority);
    const status = queryString(req.query.status);
    const applicationId = queryString(req.query.application_id);
    const dateFrom = queryString(req.query.date_from);
    const dateTo = queryString(req.query.date_to);

    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }
    if (dateFrom) {
      query = query.gte('due_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('due_date', dateTo);
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

// POST /api/tasks
router.post('/', requireAuth, validateBody(CreateTaskSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const body = req.body as {
      application_id?: string | null;
      contact_id?: string | null;
    };

    if (!(await verifyTaskLinks(db, body, user.id, res))) {
      return;
    }

    const payload = sanitizeTaskInput({ ...req.body, user_id: user.id });
    const { data, error } = await db
      .from('tasks')
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

// GET /api/tasks/:id
router.get('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { task, ownership } = await getOwnedTask(db, id, user.id);
    if (ownership !== 'ok') {
      sendTaskOwnershipError(res, ownership);
      return;
    }

    res.json({ data: task });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', requireAuth, validateBody(UpdateTaskBodySchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { ownership } = await getOwnedTask(db, id, user.id);
    if (ownership !== 'ok') {
      sendTaskOwnershipError(res, ownership);
      return;
    }

    const payload = sanitizeTaskInput(req.body as Record<string, unknown>);
    const { data, error } = await db
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
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

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { ownership } = await getOwnedTask(db, id, user.id);
    if (ownership !== 'ok') {
      sendTaskOwnershipError(res, ownership);
      return;
    }

    const { error } = await db
      .from('tasks')
      .delete()
      .eq('id', id)
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

export default router;
