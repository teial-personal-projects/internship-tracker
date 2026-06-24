import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const mockGetUser = vi.hoisted(() => vi.fn());
const mockCreateUserClient = vi.hoisted(() => vi.fn());
const mockRefreshRadarSource = vi.hoisted(() => vi.fn());
const mockValidatePostingFromSource = vi.hoisted(() => vi.fn());
const mockSearchTrustedSources = vi.hoisted(() => vi.fn());

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

vi.mock('../radar/validatePosting', () => ({
  validatePostingFromSource: mockValidatePostingFromSource,
}));

vi.mock('../radar/trustedSources/searchTrustedSources', () => ({
  searchTrustedSources: mockSearchTrustedSources,
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
    mockValidatePostingFromSource.mockResolvedValue({
      attempted: false,
      status: null,
      error: null,
    });
    mockSearchTrustedSources.mockResolvedValue([]);
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

  it('GET /api/radar/postings filters by source tier and validity status', async () => {
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
          source_tier: 'direct_ats',
          validity_status: 'live',
          first_seen_at: '2026-06-01T00:00:00.000Z',
        },
        {
          id: 'posting-2',
          user_id: USER_ID,
          company_name: 'Beta',
          title: 'Backend Engineer',
          location: 'Remote',
          status: 'new',
          source_tier: 'curated_board',
          validity_status: 'unchecked',
          first_seen_at: '2026-06-02T00:00:00.000Z',
        },
      ],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/postings?source_tier=direct_ats&validity_status=live')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: 'posting-1',
      source_tier: 'direct_ats',
      validity_status: 'live',
    });
  });

  it('GET /api/radar/postings defaults new postings to quality sort', async () => {
    const db = createMockDb({
      discovered_postings: [
        {
          id: 'aggregator-posting',
          user_id: USER_ID,
          company_name: 'Aggregator Co',
          title: 'Backend Engineer',
          location: 'Remote',
          status: 'new',
          source_tier: 'aggregator',
          validity_status: 'unchecked',
          first_seen_at: '2026-06-20T00:00:00.000Z',
        },
        {
          id: 'direct-posting',
          user_id: USER_ID,
          company_name: 'Direct Co',
          title: 'Backend Engineer',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'live',
          first_seen_at: '2026-06-01T00:00:00.000Z',
        },
      ],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/postings?status=new')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data.map((posting: Row) => posting.id)).toEqual([
      'direct-posting',
      'aggregator-posting',
    ]);
  });

  it('GET /api/radar/postings hides old closed postings by default but returns them for closed filter', async () => {
    const db = createMockDb({
      discovered_postings: [
        {
          id: 'old-closed',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Closed Role',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'closed',
          last_validated_at: '2024-01-01T00:00:00.000Z',
          first_seen_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'live-role',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Live Role',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'live',
          last_validated_at: '2026-06-01T00:00:00.000Z',
          first_seen_at: '2026-06-01T00:00:00.000Z',
        },
      ],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const defaultResponse = await request(app)
      .get('/api/radar/postings')
      .set('Authorization', 'Bearer test-token');
    const closedResponse = await request(app)
      .get('/api/radar/postings?validity_status=closed')
      .set('Authorization', 'Bearer test-token');

    expect(defaultResponse.status).toBe(200);
    expect(defaultResponse.body.data.map((posting: Row) => posting.id)).toEqual(['live-role']);
    expect(closedResponse.status).toBe(200);
    expect(closedResponse.body.data.map((posting: Row) => posting.id)).toEqual(['old-closed']);
  });

  it('GET /api/radar/postings excludes closed postings from direct ATS fresh queries', async () => {
    const db = createMockDb({
      discovered_postings: [
        {
          id: 'closed-direct',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Closed Role',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'closed',
          last_validated_at: new Date().toISOString(),
          first_seen_at: '2026-06-01T00:00:00.000Z',
        },
        {
          id: 'live-direct',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Live Role',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'live',
          first_seen_at: '2026-06-02T00:00:00.000Z',
        },
      ],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/postings?status=new&source_tier=direct_ats')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data.map((posting: Row) => posting.id)).toEqual(['live-direct']);
  });

  it('GET /api/radar/postings includes old closed postings when requested', async () => {
    const db = createMockDb({
      discovered_postings: [
        {
          id: 'old-closed',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Closed Role',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'closed',
          last_validated_at: '2024-01-01T00:00:00.000Z',
          first_seen_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'live-role',
          user_id: USER_ID,
          company_name: 'Acme',
          title: 'Live Role',
          location: 'Remote',
          status: 'new',
          source_tier: 'direct_ats',
          validity_status: 'live',
          last_validated_at: '2026-06-01T00:00:00.000Z',
          first_seen_at: '2026-06-01T00:00:00.000Z',
        },
      ],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/postings?include_closed=true')
      .set('Authorization', 'Bearer test-token');
    const ids = response.body.data.map((posting: Row) => posting.id);

    expect(response.status).toBe(200);
    expect(ids).toContain('old-closed');
    expect(ids).toContain('live-role');
  });

  it('GET /api/radar/criteria returns default trusted discovery criteria when none are saved', async () => {
    const db = createMockDb({
      radar_criteria: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .get('/api/radar/criteria')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      user_id: USER_ID,
      title_terms: ['software engineer', 'backend engineer', 'full-stack engineer', 'full stack engineer'],
      field_terms: ['edtech', 'education technology', 'mission-driven', 'civic tech', 'nonprofit tech'],
      exclude_keywords: ['junior', 'intern', 'internship'],
      location_terms: [],
      location_rules: [],
    });
  });

  it('PUT /api/radar/criteria persists editable trusted discovery criteria', async () => {
    const db = createMockDb({
      radar_criteria: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .put('/api/radar/criteria')
      .send({
        title_terms: ['backend engineer', 'software engineer'],
        field_terms: ['edtech', 'civic tech'],
        location_terms: ['New York', 'Chicago'],
        exclude_keywords: ['intern'],
        location_rules: [],
      })
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      user_id: USER_ID,
      title_terms: ['backend engineer', 'software engineer'],
      field_terms: ['edtech', 'civic tech'],
      include_keywords: [],
      exclude_keywords: ['intern'],
      seniority_terms: [],
      location_terms: ['New York', 'Chicago'],
      location_rules: [],
    });
    expect(db.rowsByTable.radar_criteria).toContainEqual(expect.objectContaining({
      id: 'radar_criteria-new',
      user_id: USER_ID,
      title_terms: ['backend engineer', 'software engineer'],
      field_terms: ['edtech', 'civic tech'],
      location_terms: ['New York', 'Chicago'],
    }));
  });

  it('POST /api/radar/search is a manual trusted source action and does not refresh watchlist sources', async () => {
    const db = createMockDb({
      radar_criteria: [{
        user_id: USER_ID,
        title_terms: ['software engineer'],
        field_terms: ['edtech'],
        include_keywords: [],
        exclude_keywords: ['intern'],
        seniority_terms: [],
        location_terms: [],
        location_rules: ['remote_us'],
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);
    mockSearchTrustedSources.mockResolvedValue([{
      sourceId: 'we_work_remotely',
      sourceName: 'We Work Remotely',
      fetched: 2,
      matched: 1,
      inserted: 1,
      error: null,
    }]);

    const response = await request(app)
      .post('/api/radar/search')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      sources_searched: 1,
      fetched: 2,
      matched: 1,
      inserted: 1,
      criteria: {
        title_terms: ['software engineer'],
        field_terms: ['edtech'],
      },
      sources: [{
        sourceId: 'we_work_remotely',
        sourceName: 'We Work Remotely',
      }],
    });
    expect(mockSearchTrustedSources).toHaveBeenCalledWith(expect.anything(), USER_ID, expect.objectContaining({
      title_terms: ['software engineer'],
    }));
    expect(mockRefreshRadarSource).not.toHaveBeenCalled();
  });

  it('PATCH /api/radar/postings/:id validates the posting before marking it seen', async () => {
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
      }],
      company_watchlist: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .patch(`/api/radar/postings/${POSTING_ID}`)
      .send({ status: 'seen' })
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: POSTING_ID,
      status: 'seen',
    });
    expect(mockValidatePostingFromSource).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      id: POSTING_ID,
      source_tier: 'direct_ats',
    }));
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
    expect(mockValidatePostingFromSource).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      id: POSTING_ID,
      title: 'Senior Software Engineer',
    }));
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
