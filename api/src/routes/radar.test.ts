import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const mockGetUser = vi.hoisted(() => vi.fn());
const mockCreateUserClient = vi.hoisted(() => vi.fn());
const mockRefreshRadarSource = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
    },
  },
  createUserClient: mockCreateUserClient,
}));

vi.mock('../radar/refreshRadarSource', () => ({
  refreshRadarSource: mockRefreshRadarSource,
}));

const USER_ID = '00000000-0000-4000-8000-000000000001';
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000002';
const POSTING_ID = '11111111-1111-4111-8111-111111111111';
const WATCHLIST_ID = '22222222-2222-4222-8222-222222222222';

type Row = Record<string, unknown> & { id?: string };

class Query {
  private readonly filters: Array<[string, string]> = [];
  private readonly ilikeFilters: Array<[string, string]> = [];
  private insertPayload: Row | null = null;
  private insertedRow: Row | null = null;
  private updatePayload: Row | null = null;
  private rowLimit: number | null = null;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select() {
    return this;
  }

  order() {
    return this;
  }

  ilike(column: string, pattern: string) {
    this.ilikeFilters.push([column, pattern]);
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

  update(payload: Row) {
    this.updatePayload = payload;
    return this;
  }

  limit(count: number) {
    this.rowLimit = count;
    return this;
  }

  async single() {
    if (this.insertPayload) {
      return { data: this.insertedRow, error: null };
    }

    return { data: this.apply()[0] ?? null, error: null };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    return Promise.resolve({ data: this.apply(), error: null }).then(resolve, reject);
  }

  private apply(): Row[] {
    const matched = this.filterRows();

    if (this.updatePayload) {
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? []).map((row) =>
        matched.includes(row) ? { ...row, ...this.updatePayload } : row,
      );
      return this.filterRows();
    }

    return this.rowLimit == null ? matched : matched.slice(0, this.rowLimit);
  }

  private filterRows(): Row[] {
    return (this.rowsByTable[this.table] ?? []).filter((row) =>
      this.filters.every(([column, value]) => row[column] === value)
      && this.ilikeFilters.every(([column, value]) => (
        typeof row[column] === 'string'
        && (row[column] as string).toLowerCase().includes(value.replaceAll('%', '').toLowerCase())
      )),
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

describe('radar routes', () => {
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

  it('GET /api/radar/postings searches posting titles', async () => {
    const db = createMockDb({
      discovered_postings: [
        {
          id: 'posting-1',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Senior Software Engineer',
          location: 'Remote',
          status: 'new',
          watchlist_id: WATCHLIST_ID,
        },
        {
          id: 'posting-2',
          user_id: USER_ID,
          company_name: 'Beta',
          title: 'Product Manager',
          location: 'Remote',
          status: 'new',
          watchlist_id: '33333333-3333-4333-8333-333333333333',
        },
      ],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/postings?search=software')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: 'posting-1',
      title: 'Senior Software Engineer',
    });
  });

  it('GET /api/radar/postings searches watchlist industries', async () => {
    const db = createMockDb({
      discovered_postings: [
        {
          id: 'posting-1',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Backend Engineer',
          location: 'Remote',
          status: 'new',
          watchlist_id: WATCHLIST_ID,
        },
        {
          id: 'posting-2',
          user_id: USER_ID,
          company_name: 'Beta',
          title: 'Backend Engineer',
          location: 'Remote',
          status: 'new',
          watchlist_id: '33333333-3333-4333-8333-333333333333',
        },
      ],
      company_watchlist: [
        {
          id: WATCHLIST_ID,
          user_id: USER_ID,
          company_name: 'Acme',
          industry: 'Education Technology',
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          user_id: USER_ID,
          company_name: 'Beta',
          industry: 'Fintech',
        },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/postings?search=education')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: 'posting-1',
      company_name: 'Acme',
    });
  });

  it('POST /api/radar/postings/:id/save-company creates a watchlist entry without creating an application', async () => {
    const db = createMockDb({
      discovered_postings: [{
        id: POSTING_ID,
        user_id: USER_ID,
        company_name: 'Acme',
        title: 'Senior Software Engineer',
        url: 'https://example.com/job',
        status: 'new',
        watchlist_id: WATCHLIST_ID,
        source_tier: 'direct_ats',
        first_seen_source: 'greenhouse',
      }],
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: USER_ID,
        company_name: 'Source Company',
        ats_type: 'greenhouse',
        ats_board_token: 'source-company',
      }],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/radar/postings/${POSTING_ID}/save-company`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      created: true,
      watchlist_entry: {
        id: 'company_watchlist-new',
        company_name: 'Acme',
        source_tier: 'direct_ats',
        source_name: 'greenhouse',
      },
    });
    expect(db.rowsByTable.company_watchlist).toContainEqual(expect.objectContaining({
      id: 'company_watchlist-new',
      user_id: USER_ID,
      company_name: 'Acme',
      radar_enabled: false,
      source_tier: 'direct_ats',
      source_name: 'greenhouse',
      ats_type: 'greenhouse',
      ats_board_token: 'source-company',
    }));
    expect(db.rowsByTable.company_watchlist).toHaveLength(2);
    expect(db.rowsByTable.applications).toHaveLength(0);
    expect(db.rowsByTable.discovered_postings[0].status).toBe('new');
  });

  it('POST /api/radar/postings/:id/save-company returns the existing watchlist row for duplicate companies', async () => {
    const db = createMockDb({
      discovered_postings: [{
        id: POSTING_ID,
        user_id: USER_ID,
        company_name: 'Acme',
        title: 'Senior Software Engineer',
        url: 'https://example.com/job',
        status: 'new',
        source_tier: 'direct_ats',
        first_seen_source: 'greenhouse',
      }],
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: USER_ID,
        company_name: 'acme',
      }],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/radar/postings/${POSTING_ID}/save-company`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      created: false,
      watchlist_entry: {
        id: WATCHLIST_ID,
        company_name: 'acme',
      },
    });
    expect(db.rowsByTable.company_watchlist).toHaveLength(1);
    expect(db.rowsByTable.applications).toHaveLength(0);
  });

  it("POST /api/radar/postings/:id/save-company returns 403 for another user's posting", async () => {
    const db = createMockDb({
      discovered_postings: [{
        id: POSTING_ID,
        user_id: OTHER_USER_ID,
        company_name: 'Acme',
        title: 'Senior Software Engineer',
        url: 'https://example.com/job',
        status: 'new',
      }],
      company_watchlist: [],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/radar/postings/${POSTING_ID}/save-company`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(db.rowsByTable.company_watchlist).toHaveLength(0);
    expect(db.rowsByTable.applications).toHaveLength(0);
    expect(db.rowsByTable.discovered_postings[0].status).toBe('new');
  });

  it("POST /api/radar/sources/:watchlistId/refresh returns 403 for another user's watchlist entry", async () => {
    const db = createMockDb({
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: OTHER_USER_ID,
        company_name: 'Acme',
        ats_type: 'greenhouse',
        ats_board_token: 'acme',
        radar_enabled: true,
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/radar/sources/${WATCHLIST_ID}/refresh`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(mockRefreshRadarSource).not.toHaveBeenCalled();
  });

  it('POST /api/radar/sources/:watchlistId/refresh returns source errors as response data', async () => {
    const db = createMockDb({
      company_watchlist: [{
        id: WATCHLIST_ID,
        user_id: USER_ID,
        company_name: 'Acme',
        ats_type: 'custom',
        ats_board_token: 'https://example.com/careers',
        radar_enabled: true,
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);
    mockRefreshRadarSource.mockResolvedValue({
      inserted: 0,
      matched: 0,
      fetched: 0,
      error: 'HTML fallback request failed with status 500',
    });

    const response = await request(app)
      .post(`/api/radar/sources/${WATCHLIST_ID}/refresh`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      inserted: 0,
      matched: 0,
      fetched: 0,
      error: 'HTML fallback request failed with status 500',
    });
  });
});
