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
const WATCHLIST_ID = '11111111-1111-4111-8111-111111111111';

type Row = Record<string, unknown> & { id?: string };

class Query {
  private readonly filters: Array<[string, string]> = [];
  private insertPayload: Row | null = null;
  private insertedRow: Row | null = null;
  private deleteRequested = false;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: string) {
    this.filters.push([column, value]);
    return this;
  }

  insert(payload: Row) {
    this.insertPayload = payload;
    this.insertedRow = { id: `${this.table}-new`, ...payload };
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), this.insertedRow];
    return this;
  }

  delete() {
    this.deleteRequested = true;
    return this;
  }

  async single() {
    if (this.insertPayload) {
      return { data: this.insertedRow, error: null };
    }

    return { data: this.filterRows()[0] ?? null, error: null };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    if (this.deleteRequested) {
      const matched = this.filterRows();
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? [])
        .filter((row) => !matched.includes(row));
      return Promise.resolve({ data: null, error: null }).then(resolve, reject);
    }

    return Promise.resolve({ data: this.filterRows(), error: null }).then(resolve, reject);
  }

  private filterRows(): Row[] {
    return (this.rowsByTable[this.table] ?? []).filter((row) =>
      this.filters.every(([column, value]) => row[column] === value),
    );
  }
}

function createMockDb(rowsByTable: Record<string, Row[]>) {
  return {
    rowsByTable,
    client: {
      from: vi.fn((table: string) => new Query(table, rowsByTable)),
    },
  };
}

describe('watchlist routes', () => {
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

  it('POST /api/watchlist/:id/promote returns the new application id and removes the watchlist entry', async () => {
    const db = createMockDb({
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: USER_ID,
        company_name: 'Acme',
        industry: 'Robotics',
      }],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/watchlist/${WATCHLIST_ID}/promote`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ application_id: 'applications-new' });
    expect(db.rowsByTable.company_watchlist).toHaveLength(0);
    expect(db.rowsByTable.applications).toContainEqual(expect.objectContaining({
      id: 'applications-new',
      user_id: USER_ID,
      company: 'Acme',
      industry: 'Robotics',
      source: 'watchlist',
      source_metadata: { watchlist_id: WATCHLIST_ID },
    }));
  });

  it('POST /api/watchlist/:id/promote returns 404 for a non-existent entry', async () => {
    const db = createMockDb({
      company_watchlist: [],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/watchlist/${WATCHLIST_ID}/promote`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(404);
    expect(db.rowsByTable.applications).toHaveLength(0);
  });

  it("POST /api/watchlist/:id/promote returns 403 for another user's entry", async () => {
    const db = createMockDb({
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: OTHER_USER_ID,
        company_name: 'Acme',
      }],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/watchlist/${WATCHLIST_ID}/promote`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(db.rowsByTable.company_watchlist).toHaveLength(1);
    expect(db.rowsByTable.applications).toHaveLength(0);
  });
});
