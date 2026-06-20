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
const APPLICATION_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_APPLICATION_ID = '11111111-1111-4111-8111-111111111112';
const CONTACT_ID = '22222222-2222-4222-8222-222222222222';
const WATCHLIST_ID = '33333333-3333-4333-8333-333333333333';

type Row = Record<string, unknown> & { id?: string };

interface QueryCall {
  method: string;
  args: unknown[];
}

class Query {
  readonly calls: QueryCall[] = [];
  private insertedRow: Row | null = null;
  private updatePayload: Row | null = null;
  private deleteRequested = false;
  private orderBy: { column: string; ascending: boolean } | null = null;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
    private readonly nextIds: Record<string, string[]>,
  ) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    this.calls.push({ method: 'order', args: [column, options] });
    return this;
  }

  eq(...args: [string, string | boolean]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  gte(...args: [string, string]) {
    this.calls.push({ method: 'gte', args });
    return this;
  }

  lte(...args: [string, string]) {
    this.calls.push({ method: 'lte', args });
    return this;
  }

  ilike(...args: [string, string]) {
    this.calls.push({ method: 'ilike', args });
    return this;
  }

  insert(payload: Row) {
    const id = payload.id ?? this.nextIds[this.table]?.shift() ?? `${this.table}-${Date.now()}`;
    this.insertedRow = {
      id,
      created_at: '2026-06-18T00:00:00.000Z',
      updated_at: '2026-06-18T00:00:00.000Z',
      ...payload,
    };
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), this.insertedRow];
    this.calls.push({ method: 'insert', args: [payload] });
    return this;
  }

  update(payload: Row) {
    this.updatePayload = payload;
    this.calls.push({ method: 'update', args: [payload] });
    return this;
  }

  delete() {
    this.deleteRequested = true;
    this.calls.push({ method: 'delete', args: [] });
    return this;
  }

  async single() {
    if (this.insertedRow) {
      return { data: this.insertedRow, error: null };
    }

    return { data: this.apply()[0] ?? null, error: null };
  }

  async range(from: number, to: number) {
    this.calls.push({ method: 'range', args: [from, to] });
    const rows = this.apply();
    return {
      data: rows.slice(from, to + 1),
      error: null,
      count: rows.length,
    };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null; count?: number }) => void,
    reject?: (reason: unknown) => void,
  ) {
    const rows = this.apply();
    return Promise.resolve({
      data: this.deleteRequested ? null : rows,
      error: null,
      count: rows.length,
    }).then(resolve, reject);
  }

  private apply(): Row[] {
    const matched = this.filteredRows();

    if (this.updatePayload) {
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? []).map((row) =>
        matched.includes(row) ? { ...row, ...this.updatePayload } : row,
      );
      return this.filteredRows();
    }

    if (this.deleteRequested) {
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? [])
        .filter((row) => !matched.includes(row));
      return [];
    }

    return matched;
  }

  private filteredRows(): Row[] {
    const rows = (this.rowsByTable[this.table] ?? []).filter((row) =>
      this.calls.every((call) => {
        const [column, value] = call.args as [string, string | boolean];

        if (call.method === 'eq') {
          return row[column] === value;
        }
        if (call.method === 'gte') {
          return typeof row[column] === 'string' && row[column] >= value;
        }
        if (call.method === 'lte') {
          return typeof row[column] === 'string' && row[column] <= value;
        }
        if (call.method === 'ilike') {
          const needle = String(value).replaceAll('%', '').toLowerCase();
          return String(row[column] ?? '').toLowerCase().includes(needle);
        }
        return true;
      }),
    );

    if (!this.orderBy) return rows;

    const { column, ascending } = this.orderBy;
    return [...rows].sort((left, right) => {
      const compare = String(left[column] ?? '').localeCompare(String(right[column] ?? ''));
      return ascending ? compare : -compare;
    });
  }
}

function createMockDb(rowsByTable: Record<string, Row[]> = {}) {
  const nextIds: Record<string, string[]> = {
    applications: [APPLICATION_ID, SECOND_APPLICATION_ID],
    contacts: [CONTACT_ID],
    company_watchlist: [WATCHLIST_ID],
    tasks: [],
  };
  const queries: Record<string, Query[]> = {};

  return {
    rowsByTable,
    queries,
    client: {
      from: vi.fn((table: string) => {
        const query = new Query(table, rowsByTable, nextIds);
        queries[table] = [...(queries[table] ?? []), query];
        return query;
      }),
    },
  };
}

describe('phase 14 final wiring', () => {
  const app = createApp('test');

  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: 'test@example.com' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates an application, updates its type, and links a contact', async () => {
    const db = createMockDb({
      applications: [],
      contacts: [],
      application_contacts: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const createApplication = await request(app)
      .post('/api/applications')
      .set('Authorization', 'Bearer test-token')
      .send({
        company: 'Acme',
        title: 'Software Engineer',
        status: 'not_started',
        application_type: 'other',
        added: '2026-06-18',
      });

    expect(createApplication.status).toBe(201);
    expect(createApplication.body.data.id).toBe(APPLICATION_ID);

    const setType = await request(app)
      .patch(`/api/applications/${APPLICATION_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ application_type: 'cold_strategic' });

    expect(setType.status).toBe(200);
    expect(db.rowsByTable.applications[0]).toMatchObject({ application_type: 'cold_strategic' });

    const createContact = await request(app)
      .post('/api/contacts')
      .set('Authorization', 'Bearer test-token')
      .send({
        application_id: APPLICATION_ID,
        first_name: 'Jamie',
        last_name: 'Rivera',
        contact_type: 'company_contact',
        outreach_status: 'not_contacted',
      });

    expect(createContact.status).toBe(201);
    expect(createContact.body.data.id).toBe(CONTACT_ID);

    const updateContact = await request(app)
      .patch(`/api/contacts/${CONTACT_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ outreach_status: 'double_down_sent' });

    expect(updateContact.status).toBe(200);
    expect(updateContact.body.data).toMatchObject({ outreach_status: 'double_down_sent' });
  });

  it('promotes a watchlist company and returns the created application in the applications list', async () => {
    const db = createMockDb({
      applications: [],
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: USER_ID,
        company_name: 'Watch Co',
        industry: 'Education',
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const promote = await request(app)
      .post(`/api/watchlist/${WATCHLIST_ID}/promote`)
      .set('Authorization', 'Bearer test-token');

    expect(promote.status).toBe(201);
    expect(promote.body.data.application_id).toBe(APPLICATION_ID);
    expect(db.rowsByTable.company_watchlist).toHaveLength(0);

    const applications = await request(app)
      .get('/api/applications?limit=25')
      .set('Authorization', 'Bearer test-token');

    expect(applications.status).toBe(200);
    expect(applications.body.data).toContainEqual(expect.objectContaining({
      id: APPLICATION_ID,
      company: 'Watch Co',
      source: 'watchlist',
      source_metadata: { watchlist_id: WATCHLIST_ID },
    }));
  });

  it('deletes an interview record scoped to the application owner', async () => {
    const interviewId = '44444444-4444-4444-8444-444444444444';
    const db = createMockDb({
      applications: [{
        id: APPLICATION_ID,
        user_id: USER_ID,
        company: 'Interview Co',
      }],
      interviews: [{
        id: interviewId,
        user_id: USER_ID,
        application_id: APPLICATION_ID,
        interview_type: 'coding',
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .delete(`/api/applications/${APPLICATION_ID}/interviews/${interviewId}`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: null });
    expect(db.rowsByTable.interviews).toEqual([]);
    expect(db.queries.interviews.at(-1)?.calls).toContainEqual({ method: 'delete', args: [] });
    expect(db.queries.interviews.at(-1)?.calls).toContainEqual({ method: 'eq', args: ['id', interviewId] });
    expect(db.queries.interviews.at(-1)?.calls).toContainEqual({ method: 'eq', args: ['application_id', APPLICATION_ID] });
    expect(db.queries.interviews.at(-1)?.calls).toContainEqual({ method: 'eq', args: ['user_id', USER_ID] });
  });

  it('filters applications by applied_date range and returns an empty result when none match', async () => {
    const db = createMockDb({
      applications: [
        { id: 'before', company: 'Before', applied_date: '2026-05-31', added: '2026-05-31' },
        { id: 'inside', company: 'Inside', applied_date: '2026-06-15', added: '2026-06-15' },
        { id: 'after', company: 'After', applied_date: '2026-07-01', added: '2026-07-01' },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const inside = await request(app)
      .get('/api/applications?date_from=2026-06-01&date_to=2026-06-30&limit=25')
      .set('Authorization', 'Bearer test-token');

    expect(inside.status).toBe(200);
    expect(inside.body.data.map((row: Row) => row.id)).toEqual(['inside']);
    expect(inside.body.total).toBe(1);

    const empty = await request(app)
      .get('/api/applications?date_from=2026-08-01&date_to=2026-08-31&limit=25')
      .set('Authorization', 'Bearer test-token');

    expect(empty.status).toBe(200);
    expect(empty.body.data).toEqual([]);
    expect(empty.body.total).toBe(0);
  });

  it('paginates 26 applications into 25 records on page 1 and one record on page 2', async () => {
    const rows = Array.from({ length: 26 }, (_, index) => ({
      id: `app-${String(index + 1).padStart(2, '0')}`,
      company: `Company ${index + 1}`,
      applied_date: '2026-06-18',
      added: `2026-06-${String(index + 1).padStart(2, '0')}`,
    }));
    const db = createMockDb({ applications: rows });
    mockCreateUserClient.mockReturnValue(db.client);

    const first = await request(app)
      .get('/api/applications?page=1&limit=25')
      .set('Authorization', 'Bearer test-token');
    const second = await request(app)
      .get('/api/applications?page=2&limit=25')
      .set('Authorization', 'Bearer test-token');

    expect(first.status).toBe(200);
    expect(first.body.data).toHaveLength(25);
    expect(first.body.total).toBe(26);
    expect(first.body.totalPages).toBe(2);
    expect(second.status).toBe(200);
    expect(second.body.data).toHaveLength(1);
    expect(second.body.total).toBe(26);
    expect(second.body.totalPages).toBe(2);
  });
});
