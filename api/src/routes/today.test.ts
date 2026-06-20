import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const mockGetUser = vi.hoisted(() => vi.fn());
const mockCreateUserClient = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
    },
  },
  createUserClient: mockCreateUserClient,
}));

interface QueryCall {
  method: string;
  args: unknown[];
}

type Row = Record<string, unknown>;

class TodayQuery {
  readonly calls: QueryCall[] = [];

  constructor(private readonly rows: Row[] = []) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: unknown[]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  gte(...args: unknown[]) {
    this.calls.push({ method: 'gte', args });
    return this;
  }

  lt(...args: unknown[]) {
    this.calls.push({ method: 'lt', args });
    return this;
  }

  lte(...args: unknown[]) {
    this.calls.push({ method: 'lte', args });
    return this;
  }

  in(...args: unknown[]) {
    this.calls.push({ method: 'in', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
    return this;
  }

  range(...args: unknown[]) {
    this.calls.push({ method: 'range', args });
    return this;
  }

  then(
    resolve: (value: { data: Row[]; error: null; count: number }) => void,
    reject?: (reason: unknown) => void,
  ) {
    const filtered = this.applyFilters();
    const data = this.applyRange(this.applyOrdering(filtered));
    return Promise.resolve({ data, error: null, count: filtered.length }).then(resolve, reject);
  }

  private applyFilters(): Row[] {
    return this.rows.filter((row) =>
      this.calls.every((call) => {
        const [column, value] = call.args as [string, unknown];
        const rowValue = row[column];

        if (call.method === 'eq') return rowValue === value;
        if (call.method === 'gte') return typeof rowValue === 'string' && typeof value === 'string' && rowValue >= value;
        if (call.method === 'lt') return typeof rowValue === 'string' && typeof value === 'string' && rowValue < value;
        if (call.method === 'lte') return typeof rowValue === 'string' && typeof value === 'string' && rowValue <= value;
        if (call.method === 'in') return Array.isArray(value) && value.includes(rowValue);
        return true;
      }),
    );
  }

  private applyOrdering(rows: Row[]): Row[] {
    const orderCalls = this.calls.filter((call) => call.method === 'order');

    return [...rows].sort((left, right) => {
      for (const call of orderCalls) {
        const [column, options] = call.args as [string, { ascending?: boolean; nullsFirst?: boolean }];
        const leftValue = left[column] as string | null | undefined;
        const rightValue = right[column] as string | null | undefined;

        if (leftValue == null && rightValue == null) continue;
        if (leftValue == null) return options.nullsFirst ? -1 : 1;
        if (rightValue == null) return options.nullsFirst ? 1 : -1;

        const comparison = leftValue.localeCompare(rightValue);
        if (comparison !== 0) return options.ascending === false ? -comparison : comparison;
      }

      return 0;
    });
  }

  private applyRange(rows: Row[]): Row[] {
    const rangeCall = this.calls.find((call) => call.method === 'range');
    if (!rangeCall) return rows;

    const [from, to] = rangeCall.args as [number, number];
    return rows.slice(from, to + 1);
  }
}

function createMockDb(queries: Record<string, TodayQuery[]>) {
  return {
    from: vi.fn((table: string) => {
      const queue = queries[table];
      const query = queue?.shift();
      if (!query) {
        throw new Error(`Unexpected table query: ${table}`);
      }
      return query;
    }),
  };
}

describe('GET /api/today', () => {
  const app = createApp('test');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T16:00:00.000Z'));
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns zero counts and empty panel arrays for a user with no data', async () => {
    const applicationsForPipeline = new TodayQuery([]);
    const upNext = new TodayQuery([]);
    const interviewsThisWeek = new TodayQuery([]);
    const actionItems = new TodayQuery([]);
    const needAttention = new TodayQuery([]);
    const overdueFollowUps = new TodayQuery([]);
    const recentContacts = new TodayQuery([]);

    mockCreateUserClient.mockReturnValue(createMockDb({
      applications: [applicationsForPipeline, needAttention],
      interviews: [upNext, interviewsThisWeek],
      tasks: [actionItems],
      contacts: [overdueFollowUps, recentContacts],
    }));

    const response = await request(app)
      .get('/api/today')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        stats: {
          applications: 0,
          open_tasks: 0,
          interviews_this_week: 0,
        },
        up_next: [],
        action_items: [],
        need_attention: [],
        funnel: [
          { key: 'applied', label: 'Applied', count: 0, percent: 0 },
          { key: 'interviewing', label: 'Interviewing', count: 0, percent: 0 },
          { key: 'offered', label: 'Offered', count: 0, percent: 0 },
        ],
        overdue_follow_ups: [],
        recent_contacts: [],
      },
    });
    expect(applicationsForPipeline.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(upNext.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(interviewsThisWeek.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(actionItems.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(needAttention.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(overdueFollowUps.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(overdueFollowUps.calls).toContainEqual({
      method: 'in',
      args: ['outreach_status', ['applied_msg_sent', 'double_down_sent', 'follow_up_sent']],
    });
    expect(overdueFollowUps.calls).toContainEqual({ method: 'lt', args: ['date_of_last_outreach', '2026-06-11'] });
    expect(recentContacts.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(upNext.calls).toContainEqual({ method: 'range', args: [0, 0] });
    expect(actionItems.calls).toContainEqual({ method: 'range', args: [0, 5] });
    expect(needAttention.calls).toContainEqual({ method: 'range', args: [0, 4] });
    expect(overdueFollowUps.calls).toContainEqual({ method: 'range', args: [0, 4] });
    expect(recentContacts.calls).toContainEqual({ method: 'range', args: [0, 4] });
  });

  it('returns the soonest future scheduled interview and excludes past interviews', async () => {
    const interviews = [
      {
        id: 'past-interview',
        user_id: 'user-1',
        application_id: 'app-1',
        status: 'scheduled',
        scheduled_at: '2026-06-18T15:00:00.000Z',
        applications: { company: 'Past Co', title: 'Past Role', application_type: 'cold_strategic', user_id: 'user-1' },
      },
      {
        id: 'later-interview',
        user_id: 'user-1',
        application_id: 'app-2',
        status: 'scheduled',
        scheduled_at: '2026-06-19T19:00:00.000Z',
        applications: { company: 'Later Co', title: 'Later Role', application_type: 'referral', user_id: 'user-1' },
      },
      {
        id: 'next-interview',
        user_id: 'user-1',
        application_id: 'app-3',
        status: 'scheduled',
        scheduled_at: '2026-06-18T18:00:00.000Z',
        applications: { company: 'Next Co', title: 'Next Role', application_type: 'recruiter_assisted', user_id: 'user-1' },
      },
      {
        id: 'cancelled-interview',
        user_id: 'user-1',
        application_id: 'app-4',
        status: 'cancelled',
        scheduled_at: '2026-06-18T17:00:00.000Z',
        applications: { company: 'Cancelled Co', title: 'Cancelled Role', application_type: 'other', user_id: 'user-1' },
      },
    ];

    mockCreateUserClient.mockReturnValue(createMockDb({
      applications: [new TodayQuery([]), new TodayQuery([])],
      interviews: [new TodayQuery(interviews), new TodayQuery(interviews)],
      tasks: [new TodayQuery([])],
      contacts: [new TodayQuery([]), new TodayQuery([])],
    }));

    const response = await request(app)
      .get('/api/today')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data.up_next).toHaveLength(1);
    expect(response.body.data.up_next[0]).toMatchObject({
      id: 'next-interview',
      application_company: 'Next Co',
      application_title: 'Next Role',
      application_type: 'recruiter_assisted',
    });
  });

  it('returns application type on action item application context', async () => {
    const tasks = [
      {
        id: 'task-1',
        user_id: 'user-1',
        title: 'Send follow-up',
        status: 'open',
        priority: 'high',
        due_date: '2026-06-19',
        application_id: 'app-1',
        contact_id: null,
        applications: {
          company: 'Recruiter Co',
          title: 'Hardware Intern',
          application_type: 'recruiter_assisted',
          user_id: 'user-1',
        },
        contacts: null,
      },
    ];

    mockCreateUserClient.mockReturnValue(createMockDb({
      applications: [new TodayQuery([]), new TodayQuery([])],
      interviews: [new TodayQuery([]), new TodayQuery([])],
      tasks: [new TodayQuery(tasks)],
      contacts: [new TodayQuery([]), new TodayQuery([])],
    }));

    const response = await request(app)
      .get('/api/today')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data.action_items[0]).toMatchObject({
      id: 'task-1',
      application_company: 'Recruiter Co',
      application_title: 'Hardware Intern',
      application_type: 'recruiter_assisted',
    });
  });

  it('excludes follow-ups inside the threshold and closed outreach statuses', async () => {
    const contacts = [
      {
        id: 'overdue-contact',
        user_id: 'user-1',
        outreach_status: 'follow_up_sent',
        date_of_last_outreach: '2026-06-10',
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
      {
        id: 'inside-threshold',
        user_id: 'user-1',
        outreach_status: 'follow_up_sent',
        date_of_last_outreach: '2026-06-12',
        first_name: 'Grace',
        last_name: 'Hopper',
      },
      {
        id: 'closed-status',
        user_id: 'user-1',
        outreach_status: 'replied',
        date_of_last_outreach: '2026-06-01',
        first_name: 'Katherine',
        last_name: 'Johnson',
      },
    ];

    mockCreateUserClient.mockReturnValue(createMockDb({
      applications: [new TodayQuery([]), new TodayQuery([])],
      interviews: [new TodayQuery([]), new TodayQuery([])],
      tasks: [new TodayQuery([])],
      contacts: [new TodayQuery(contacts), new TodayQuery([])],
    }));

    const response = await request(app)
      .get('/api/today')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data.overdue_follow_ups.map((contact: Row) => contact.id)).toEqual(['overdue-contact']);
  });
});
