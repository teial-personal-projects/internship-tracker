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
    return Promise.resolve({ data: this.rows, error: null, count: this.rows.length }).then(resolve, reject);
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
          phone_screens: 0,
          open_tasks: 0,
          interviews_this_week: 0,
        },
        up_next: [],
        action_items: [],
        need_attention: [],
        funnel: [
          { key: 'applied', label: 'Applied', count: 0, percent: 0 },
          { key: 'screening', label: 'Phone screen', count: 0, percent: 0 },
          { key: 'technical', label: 'Technical', count: 0, percent: 0 },
          { key: 'final_offer', label: 'Final / Offer', count: 0, percent: 0 },
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
    expect(recentContacts.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
    expect(upNext.calls).toContainEqual({ method: 'range', args: [0, 0] });
    expect(actionItems.calls).toContainEqual({ method: 'range', args: [0, 5] });
    expect(needAttention.calls).toContainEqual({ method: 'range', args: [0, 4] });
    expect(overdueFollowUps.calls).toContainEqual({ method: 'range', args: [0, 4] });
    expect(recentContacts.calls).toContainEqual({ method: 'range', args: [0, 4] });
  });
});
