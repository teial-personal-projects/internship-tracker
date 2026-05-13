import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserClient } from '../lib/supabase';
import { createDoubleDownFollowUpTask } from '../services/taskAutoGeneration';
import {
  CreateContactInteractionSchema,
  CreateContactSchema,
  CreateContactTemplateSchema,
  UpdateContactSchema,
  UpdateContactTemplateSchema,
} from '@internship-tracker/shared';
import type { Request, Response } from 'express';

const router = Router();

const CreateContactInteractionBodySchema = CreateContactInteractionSchema.omit({ contact_id: true });
const CreateContactTemplateBodySchema = CreateContactTemplateSchema.omit({ contact_id: true });
const UpdateContactTemplateBodySchema = UpdateContactTemplateSchema.omit({ contact_id: true });

type Ownership = 'ok' | 'not_found' | 'forbidden';

async function verifyApplicationOwnership(
  db: ReturnType<typeof createUserClient>,
  applicationId: string,
  userId: string,
): Promise<Ownership> {
  const { data, error } = await db
    .from('applications')
    .select('id, user_id')
    .eq('id', applicationId)
    .single();

  if (error || !data) return 'not_found';
  return (data as { user_id: string }).user_id === userId ? 'ok' : 'forbidden';
}

async function getOwnedContact(
  db: ReturnType<typeof createUserClient>,
  contactId: string,
  userId: string,
) {
  const { data, error } = await db
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error || !data) return { contact: null, ownership: 'not_found' as const };
  if ((data as { user_id: string }).user_id !== userId) {
    return { contact: data, ownership: 'forbidden' as const };
  }
  return { contact: data, ownership: 'ok' as const };
}

function sendOwnershipError(res: Response, ownership: Exclude<Ownership, 'ok'>): void {
  if (ownership === 'forbidden') {
    res.status(403).json({ error: 'Contact does not belong to current user' });
    return;
  }
  res.status(404).json({ error: 'Contact not found' });
}

// GET /api/contacts
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);

    let query = db
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.contact_type) {
      query = query.eq('contact_type', req.query.contact_type as string);
    }
    if (req.query.application_id) {
      query = query.eq('application_id', req.query.application_id as string);
    }
    if (req.query.outreach_status) {
      query = query.eq('outreach_status', req.query.outreach_status as string);
    }
    if (req.query.recruiter_status) {
      query = query.eq('recruiter_status', req.query.recruiter_status as string);
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

// POST /api/contacts
router.post('/', requireAuth, validateBody(CreateContactSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const body = req.body as z.infer<typeof CreateContactSchema>;

    if (body.application_id) {
      const ownership = await verifyApplicationOwnership(db, body.application_id, user.id);
      if (ownership !== 'ok') {
        res.status(400).json({ error: 'Application does not belong to current user' });
        return;
      }
    }

    const { data, error } = await db
      .from('contacts')
      .insert({ ...body, user_id: user.id })
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

// GET /api/contacts/:id/interactions
router.get('/:id/interactions', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { data, error } = await db
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', id)
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

// POST /api/contacts/:id/interactions
router.post('/:id/interactions', requireAuth, validateBody(CreateContactInteractionBodySchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const body = req.body as z.infer<typeof CreateContactInteractionBodySchema>;
    const { data, error } = await db
      .from('contact_interactions')
      .insert({
        ...body,
        contact_id: id,
        user_id: user.id,
        occurred_at: body.occurred_at ?? new Date().toISOString(),
      })
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

// POST /api/contacts/:id/templates
router.post('/:id/templates', requireAuth, validateBody(CreateContactTemplateBodySchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { data, error } = await db
      .from('contact_templates')
      .insert({ ...req.body, contact_id: id, user_id: user.id })
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

// PATCH /api/contacts/:id/templates/:tid
router.patch('/:id/templates/:tid', requireAuth, validateBody(UpdateContactTemplateBodySchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id, tid } = req.params;

    const { ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { data, error } = await db
      .from('contact_templates')
      .update(req.body)
      .eq('id', tid)
      .eq('contact_id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/contacts/:id/templates/:tid
router.delete('/:id/templates/:tid', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id, tid } = req.params;

    const { ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { error } = await db
      .from('contact_templates')
      .delete()
      .eq('id', tid)
      .eq('contact_id', id)
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

// GET /api/contacts/:id
router.get('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { contact, ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    res.json({ data: contact });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/contacts/:id
router.patch('/:id', requireAuth, validateBody(UpdateContactSchema), async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { contact, ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const body = req.body as z.infer<typeof UpdateContactSchema>;
    if (body.application_id) {
      const appOwnership = await verifyApplicationOwnership(db, body.application_id, user.id);
      if (appOwnership !== 'ok') {
        res.status(400).json({ error: 'Application does not belong to current user' });
        return;
      }
    }

    const { data, error } = await db
      .from('contacts')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const previousStatus = (contact as { outreach_status?: string | null }).outreach_status;
    if (previousStatus !== 'double_down_sent' && body.outreach_status === 'double_down_sent') {
      const { error: taskError } = await createDoubleDownFollowUpTask(
        db,
        id,
        user.id,
        ((data as { application_id?: string | null }).application_id ?? null),
      );
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

// DELETE /api/contacts/:id
router.delete('/:id', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const { id } = req.params;

    const { ownership } = await getOwnedContact(db, id, user.id);
    if (ownership !== 'ok') {
      sendOwnershipError(res, ownership);
      return;
    }

    const { error } = await db
      .from('contacts')
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
