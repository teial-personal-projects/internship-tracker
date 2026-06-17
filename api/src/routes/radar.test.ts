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
  private insertPayload: Row | null = null;
  private insertedRow: Row | null = null;
  private updatePayload: Row | null = null;

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

  ilike() {
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

    return matched;
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

  it('POST /api/radar/postings/:id/promote creates an application and marks the posting promoted', async () => {
    const db = createMockDb({
      discovered_postings: [{
        id: POSTING_ID,
        user_id: USER_ID,
        company_name: 'Acme',
        title: 'Senior Software Engineer',
        url: 'https://example.com/job',
        status: 'new',
      }],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/radar/postings/${POSTING_ID}/promote`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ application_id: 'applications-new' });
    expect(db.rowsByTable.applications).toContainEqual(expect.objectContaining({
      id: 'applications-new',
      user_id: USER_ID,
      company: 'Acme',
      title: 'Senior Software Engineer',
      job_link: 'https://example.com/job',
      source: 'radar',
      source_metadata: { discovered_posting_id: POSTING_ID },
      applied_date: null,
    }));
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      id: POSTING_ID,
      status: 'promoted',
    });
  });

  it("POST /api/radar/postings/:id/promote returns 403 for another user's posting", async () => {
    const db = createMockDb({
      discovered_postings: [{
        id: POSTING_ID,
        user_id: OTHER_USER_ID,
        company_name: 'Acme',
        title: 'Senior Software Engineer',
        url: 'https://example.com/job',
        status: 'new',
      }],
      applications: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/radar/postings/${POSTING_ID}/promote`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
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
});
