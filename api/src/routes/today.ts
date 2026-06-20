import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { createUserClient } from '../lib/supabase';
import {
  getPipelineCounts,
  getTodayPipelineBuckets,
  type PipelineCountsDb,
} from '../lib/pipelineCounts';
import type {
  Application,
  Contact,
  Interview,
  TodayPayload,
  TodayTask,
} from '@internship-tracker/shared';
import type { Request } from 'express';

const router = Router();

const UP_NEXT_LIMIT = 1;
const ACTION_ITEMS_LIMIT = 6;
const NEED_ATTENTION_LIMIT = 5;
const OVERDUE_FOLLOW_UPS_LIMIT = 5;
const RECENT_CONTACTS_LIMIT = 5;
const FOLLOW_UP_OVERDUE_DAYS = 7;

const ACTIVE_APPLICATION_STATUSES = [
  'in_progress',
  'applied',
  'screening',
  'interviewing',
  'technical',
  'on_site',
  'final_round',
];

const FOLLOW_UP_OUTREACH_STATUSES = [
  'applied_msg_sent',
  'double_down_sent',
  'follow_up_sent',
];

interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
  count?: number | null;
}

type ApplicationJoin = Pick<Application, 'company' | 'title' | 'application_type' | 'user_id'> | null;
type ContactJoin = Pick<Contact, 'first_name' | 'last_name' | 'user_id'> | null;

type InterviewRow = Interview & {
  applications: ApplicationJoin;
};

type TaskRow = Omit<TodayTask, 'application_company' | 'application_title' | 'contact_name'> & {
  applications: ApplicationJoin;
  contacts: ContactJoin;
};

function startOfToday(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(value: Date): Date {
  const result = startOfToday(value);
  result.setDate(result.getDate() + 7);
  return result;
}

function dateDaysAgo(value: Date, days: number): string {
  const result = startOfToday(value);
  result.setDate(result.getDate() - days);
  return result.toISOString().split('T')[0];
}

function ensureSuccess<T>(result: QueryResult<T>): T[] {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data ?? [];
}

function countOrZero(result: QueryResult<unknown>): number {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.count ?? result.data?.length ?? 0;
}

function isOwnedApplicationJoin(application: ApplicationJoin, userId: string): application is NonNullable<ApplicationJoin> {
  return application?.user_id === userId;
}

function isOwnedContactJoin(contact: ContactJoin, userId: string): contact is NonNullable<ContactJoin> {
  return contact?.user_id === userId;
}

function toTodayInterview(row: InterviewRow, userId: string) {
  if (!isOwnedApplicationJoin(row.applications, userId)) return null;

  const { applications, ...interview } = row;
  return {
    ...interview,
    application_company: applications.company,
    application_title: applications.title,
    application_type: applications.application_type,
  };
}

function toTodayTask(row: TaskRow, userId: string): TodayTask | null {
  const application = row.application_id ? row.applications : null;
  const contact = row.contact_id ? row.contacts : null;

  if (row.application_id && !isOwnedApplicationJoin(application, userId)) return null;
  if (row.contact_id && !isOwnedContactJoin(contact, userId)) return null;

  const { applications, contacts, ...task } = row;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}` : null;

  return {
    ...task,
    application_company: application?.company ?? null,
    application_title: application?.title ?? null,
    application_type: application?.application_type ?? null,
    contact_name: contactName,
  };
}

// GET /api/today
router.get('/', requireAuth, async (req: Request, res, next) => {
  try {
    const db = createUserClient(req);
    const user = (req as AuthRequest).user;
    const now = new Date();
    const todayStart = startOfToday(now).toISOString();
    const weekEnd = endOfWeek(now).toISOString();
    const overdueBefore = dateDaysAgo(now, FOLLOW_UP_OVERDUE_DAYS);

    const [
      pipeline,
      upNextResult,
      interviewsThisWeekResult,
      actionItemsResult,
      needAttentionResult,
      overdueFollowUpsResult,
      recentContactsResult,
    ] = await Promise.all([
      getPipelineCounts(db as unknown as PipelineCountsDb, user.id),
      db
        .from('interviews')
        .select('*, applications(company, title, application_type, user_id)')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .order('scheduled_at', { ascending: true })
        .range(0, UP_NEXT_LIMIT - 1),
      db
        .from('interviews')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', weekEnd),
      db
        .from('tasks')
        .select('*, applications(company, title, application_type, user_id), contacts(first_name, last_name, user_id)', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .range(0, ACTION_ITEMS_LIMIT - 1),
      db
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ACTIVE_APPLICATION_STATUSES)
        .order('updated_at', { ascending: false })
        .range(0, NEED_ATTENTION_LIMIT - 1),
      db
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .in('outreach_status', FOLLOW_UP_OUTREACH_STATUSES)
        // Exact recency can later use MAX(contact_interactions.occurred_at).
        .lt('date_of_last_outreach', overdueBefore)
        .order('date_of_last_outreach', { ascending: true, nullsFirst: false })
        .range(0, OVERDUE_FOLLOW_UPS_LIMIT - 1),
      db
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('date_of_last_outreach', { ascending: false, nullsFirst: false })
        .range(0, RECENT_CONTACTS_LIMIT - 1),
    ]);

    const upNext = ensureSuccess(upNextResult as QueryResult<InterviewRow>)
      .map((row) => toTodayInterview(row, user.id))
      .filter((row): row is NonNullable<typeof row> => row !== null);
    const actionItems = ensureSuccess(actionItemsResult as QueryResult<TaskRow>)
      .map((row) => toTodayTask(row, user.id))
      .filter((row): row is TodayTask => row !== null);
    const needAttention = ensureSuccess(needAttentionResult as QueryResult<Application>);
    const overdueFollowUps = ensureSuccess(overdueFollowUpsResult as QueryResult<Contact>);
    const recentContacts = ensureSuccess(recentContactsResult as QueryResult<Contact>);

    const payload: TodayPayload = {
      stats: {
        applications: pipeline.total,
        phone_screens: pipeline.counts.screening,
        open_tasks: countOrZero(actionItemsResult as QueryResult<unknown>),
        interviews_this_week: countOrZero(interviewsThisWeekResult as QueryResult<unknown>),
      },
      up_next: upNext,
      action_items: actionItems,
      need_attention: needAttention,
      funnel: getTodayPipelineBuckets(pipeline),
      overdue_follow_ups: overdueFollowUps,
      recent_contacts: recentContacts,
    };

    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
});

export default router;
