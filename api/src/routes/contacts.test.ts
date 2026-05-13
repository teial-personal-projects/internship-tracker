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

const USER_ID = '00000000-0000-4000-8000-000000000001';
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000002';
const APPLICATION_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_ID = '22222222-2222-4222-8222-222222222222';
const TEMPLATE_ID = '33333333-3333-4333-8333-333333333333';

type Row = Record<string, unknown> & { id?: string };

interface QueryCall {
  method: string;
  args: unknown[];
}

class Query {
  readonly calls: QueryCall[] = [];
  private insertPayload: Row | null = null;
  private updatePayload: Row | null = null;
  private deleteRequested = false;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
    return this;
  }

  eq(...args: [string, string]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  insert(payload: Row) {
    this.calls.push({ method: 'insert', args: [payload] });
    this.insertPayload = payload;
    const row = { id: `${this.table}-new`, ...payload };
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), row];
    return this;
  }

  update(payload: Row) {
    this.calls.push({ method: 'update', args: [payload] });
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.calls.push({ method: 'delete', args: [] });
    this.deleteRequested = true;
    return this;
  }

  async single() {
    const row = this.applyWriteAndFilter()[0] ?? null;
    return { data: row, error: null };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    const rows = this.applyOrdering(this.applyWriteAndFilter());
    return Promise.resolve({ data: this.deleteRequested ? null : rows, error: null }).then(resolve, reject);
  }

  private applyWriteAndFilter(): Row[] {
    if (this.insertPayload) {
      return this.applyFilters();
    }

    const rows = this.rowsByTable[this.table] ?? [];
    const matched = this.applyFilters();

    if (this.updatePayload) {
      this.rowsByTable[this.table] = rows.map((row) =>
        matched.includes(row) ? { ...row, ...this.updatePayload } : row,
      );
      return this.applyFilters();
    }

    if (this.deleteRequested) {
      this.rowsByTable[this.table] = rows.filter((row) => !matched.includes(row));
      return [];
    }

    return matched;
  }

  private applyFilters(): Row[] {
    const rows = this.rowsByTable[this.table] ?? [];
    return rows.filter((row) =>
      this.calls.every((call) => {
        if (call.method !== 'eq') return true;
        const [column, value] = call.args as [string, string];
        return row[column] === value;
      }),
    );
  }

  private applyOrdering(rows: Row[]): Row[] {
    const orderCall = this.calls.find((call) => call.method === 'order');
    if (!orderCall) return rows;
    const [column, options] = orderCall.args as [string, { ascending: boolean }];
    return [...rows].sort((left, right) => {
      const leftValue = String(left[column] ?? '');
      const rightValue = String(right[column] ?? '');
      return options.ascending
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    });
  }
}

function createMockDb(rowsByTable: Record<string, Row[]>) {
  const queries: Record<string, Query[]> = {};
  return {
    rowsByTable,
    queries,
    client: {
      from: vi.fn((table: string) => {
        const query = new Query(table, rowsByTable);
        queries[table] = [...(queries[table] ?? []), query];
        return query;
      }),
    },
  };
}

describe('contacts routes', () => {
  const app = createApp('test');

  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: 'test@example.com' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('GET /api/contacts applies supported filters', async () => {
    const db = createMockDb({
      contacts: [
        {
          id: CONTACT_ID,
          user_id: USER_ID,
          contact_type: 'company_contact',
          application_id: APPLICATION_ID,
          outreach_status: 'double_down_sent',
          recruiter_status: null,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get(`/api/contacts?contact_type=company_contact&application_id=${APPLICATION_ID}&outreach_status=double_down_sent&recruiter_status=active`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(db.queries.contacts[0].calls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['contact_type', 'company_contact'] },
      { method: 'eq', args: ['application_id', APPLICATION_ID] },
      { method: 'eq', args: ['outreach_status', 'double_down_sent'] },
      { method: 'eq', args: ['recruiter_status', 'active'] },
    ]));
  });

  it('POST /api/contacts rejects application_id owned by another user', async () => {
    const db = createMockDb({
      applications: [{ id: APPLICATION_ID, user_id: OTHER_USER_ID }],
      contacts: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post('/api/contacts')
      .set('Authorization', 'Bearer test-token')
      .send({
        application_id: APPLICATION_ID,
        first_name: 'Ada',
        last_name: 'Lovelace',
        contact_type: 'company_contact',
      });

    expect(response.status).toBe(400);
    expect(db.rowsByTable.contacts).toHaveLength(0);
  });

  it('PATCH /api/contacts/:id creates a follow-up task when outreach becomes double_down_sent', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    const db = createMockDb({
      contacts: [{
        id: CONTACT_ID,
        user_id: USER_ID,
        first_name: 'Ada',
        last_name: 'Lovelace',
        application_id: APPLICATION_ID,
        outreach_status: 'applied_msg_sent',
      }],
      tasks: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .patch(`/api/contacts/${CONTACT_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ outreach_status: 'double_down_sent' });

    expect(response.status).toBe(200);
    expect(db.rowsByTable.tasks).toHaveLength(1);
    expect(db.rowsByTable.tasks[0]).toMatchObject({
      user_id: USER_ID,
      title: 'Send follow-up to Ada Lovelace',
      category: 'outreach',
      priority: 'high',
      status: 'open',
      due_date: '2026-05-15',
      application_id: APPLICATION_ID,
      contact_id: CONTACT_ID,
      is_auto_generated: true,
    });
  });

  it('POST and GET /api/contacts/:id/interactions append and list interactions newest first', async () => {
    const db = createMockDb({
      contacts: [{ id: CONTACT_ID, user_id: USER_ID }],
      contact_interactions: [{
        id: 'old',
        contact_id: CONTACT_ID,
        user_id: USER_ID,
        purpose: 'note',
        occurred_at: '2026-01-01T00:00:00.000Z',
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const postResponse = await request(app)
      .post(`/api/contacts/${CONTACT_ID}/interactions`)
      .set('Authorization', 'Bearer test-token')
      .send({ purpose: 'follow_up', body: 'Sent follow-up.' });

    expect(postResponse.status).toBe(201);
    expect(db.rowsByTable.contact_interactions).toHaveLength(2);

    const getResponse = await request(app)
      .get(`/api/contacts/${CONTACT_ID}/interactions`)
      .set('Authorization', 'Bearer test-token');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.map((interaction: Row) => interaction.purpose)).toEqual(['follow_up', 'note']);
  });

  it('GET, POST, PATCH, and DELETE contact templates are scoped to the owned contact', async () => {
    const db = createMockDb({
      contacts: [{ id: CONTACT_ID, user_id: USER_ID }],
      contact_templates: [{ id: TEMPLATE_ID, contact_id: CONTACT_ID, user_id: USER_ID, name: 'Old' }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const getResponse = await request(app)
      .get(`/api/contacts/${CONTACT_ID}/templates`)
      .set('Authorization', 'Bearer test-token');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toHaveLength(1);

    const postResponse = await request(app)
      .post(`/api/contacts/${CONTACT_ID}/templates`)
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Intro', template_type: 'intro_pitch', body: 'Hello' });

    expect(postResponse.status).toBe(201);

    const patchResponse = await request(app)
      .patch(`/api/contacts/${CONTACT_ID}/templates/${TEMPLATE_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Updated' });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.data.name).toBe('Updated');

    const deleteResponse = await request(app)
      .delete(`/api/contacts/${CONTACT_ID}/templates/${TEMPLATE_ID}`)
      .set('Authorization', 'Bearer test-token');

    expect(deleteResponse.status).toBe(200);
  });
});
