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

interface TableRow {
  id: string;
  user_id?: string;
  application_id?: string;
  occurred_at?: string;
  event_type?: string;
  body?: string | null;
  contact_id?: string | null;
}

interface QueryCall {
  method: string;
  args: unknown[];
}

class TableQuery {
  readonly calls: QueryCall[] = [];

  constructor(
    private readonly table: string,
    private readonly rows: TableRow[],
    private readonly insertedRows: Record<string, TableRow[]>,
  ) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: [string, string]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  order(...args: [string, { ascending: boolean }]) {
    this.calls.push({ method: 'order', args });
    return this;
  }

  insert(payload: TableRow) {
    this.calls.push({ method: 'insert', args: [payload] });
    this.insertedRows[this.table] = [...(this.insertedRows[this.table] ?? []), payload];
    return new InsertQuery(payload);
  }

  async single() {
    return { data: this.applyFilters()[0] ?? null, error: null };
  }

  then(
    resolve: (value: { data: TableRow[]; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    const rows = this.applyOrdering(this.applyFilters());
    return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
  }

  private applyFilters(): TableRow[] {
    return this.rows.filter((row) =>
      this.calls.every((call) => {
        if (call.method !== 'eq') return true;
        const [column, value] = call.args as [keyof TableRow, string];
        return row[column] === value;
      }),
    );
  }

  private applyOrdering(rows: TableRow[]): TableRow[] {
    const orderCall = this.calls.find((call) => call.method === 'order');
    if (!orderCall) return rows;

    const [column, options] = orderCall.args as [keyof TableRow, { ascending: boolean }];
    return [...rows].sort((left, right) => {
      const leftValue = String(left[column] ?? '');
      const rightValue = String(right[column] ?? '');
      return options.ascending
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    });
  }
}

class InsertQuery {
  constructor(private readonly payload: TableRow) {}

  select() {
    return this;
  }

  async single() {
    return {
      data: {
        ...this.payload,
        id: this.payload.id ?? 'event-new',
        created_at: '2026-05-12T00:00:00.000Z',
      },
      error: null,
    };
  }
}

function createMockDb(rowsByTable: Record<string, TableRow[]>) {
  const queries: Record<string, TableQuery[]> = {};
  const insertedRows: Record<string, TableRow[]> = {};

  return {
    insertedRows,
    queries,
    client: {
      from: vi.fn((table: string) => {
        const query = new TableQuery(table, rowsByTable[table] ?? [], insertedRows);
        queries[table] = [...(queries[table] ?? []), query];
        return query;
      }),
    },
  };
}

describe('application event routes', () => {
  const app = createApp('test');

  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/applications/:id/events lists events newest first after parent ownership check', async () => {
    const db = createMockDb({
      applications: [{ id: 'app-1', user_id: 'user-1' }],
      application_events: [
        { id: 'event-old', application_id: 'app-1', user_id: 'user-1', occurred_at: '2026-01-01T00:00:00.000Z' },
        { id: 'event-new', application_id: 'app-1', user_id: 'user-1', occurred_at: '2026-02-01T00:00:00.000Z' },
        { id: 'event-other-app', application_id: 'app-2', user_id: 'user-1', occurred_at: '2026-03-01T00:00:00.000Z' },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/applications/app-1/events')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data.map((event: TableRow) => event.id)).toEqual(['event-new', 'event-old']);
    expect(db.queries.application_events[0].calls).toContainEqual({
      method: 'order',
      args: ['occurred_at', { ascending: false }],
    });
  });

  it('POST /api/applications/:id/events creates an event and defaults occurred_at', async () => {
    const db = createMockDb({
      applications: [{ id: 'app-1', user_id: 'user-1' }],
      contacts: [{ id: '11111111-1111-4111-8111-111111111111', user_id: 'user-1' }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post('/api/applications/app-1/events')
      .set('Authorization', 'Bearer test-token')
      .send({
        event_type: 'note',
        body: 'Followed up with hiring manager.',
        contact_id: '11111111-1111-4111-8111-111111111111',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      application_id: 'app-1',
      user_id: 'user-1',
      event_type: 'note',
      body: 'Followed up with hiring manager.',
      contact_id: '11111111-1111-4111-8111-111111111111',
    });
    expect(typeof response.body.data.occurred_at).toBe('string');
    expect(db.insertedRows.application_events).toHaveLength(1);
  });

  it('POST /api/applications/:id/events returns 403 when the parent application belongs to another user', async () => {
    const db = createMockDb({
      applications: [{ id: 'app-1', user_id: 'other-user' }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post('/api/applications/app-1/events')
      .set('Authorization', 'Bearer test-token')
      .send({ event_type: 'note' });

    expect(response.status).toBe(403);
    expect(db.insertedRows.application_events).toBeUndefined();
  });

  it('POST /api/applications/:id/events returns 400 when contact_id belongs to another user', async () => {
    const db = createMockDb({
      applications: [{ id: 'app-1', user_id: 'user-1' }],
      contacts: [{ id: '11111111-1111-4111-8111-111111111111', user_id: 'other-user' }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post('/api/applications/app-1/events')
      .set('Authorization', 'Bearer test-token')
      .send({
        event_type: 'note',
        contact_id: '11111111-1111-4111-8111-111111111111',
      });

    expect(response.status).toBe(400);
    expect(db.insertedRows.application_events).toBeUndefined();
  });
});
