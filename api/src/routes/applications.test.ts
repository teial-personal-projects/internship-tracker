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

interface ApplicationRow {
  id: string;
  company: string;
  applied_date: string | null;
  added?: string | null;
  location?: string | null;
  status?: string;
  application_type?: string | null;
  source?: string;
  source_metadata?: Record<string, unknown>;
}

interface QueryCall {
  method: string;
  args: unknown[];
}

class ApplicationsQuery {
  readonly calls: QueryCall[] = [];

  constructor(private readonly rows: ApplicationRow[]) {}

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

  ilike(...args: [string, string]) {
    this.calls.push({ method: 'ilike', args });
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

  async range(from: number, to: number) {
    this.calls.push({ method: 'range', args: [from, to] });
    const filteredRows = this.applyOrdering(this.applyFilters());
    return {
      data: filteredRows.slice(from, to + 1),
      error: null,
      count: filteredRows.length,
    };
  }

  private applyFilters(): ApplicationRow[] {
    return this.rows.filter((row) =>
      this.calls.every((call) => {
        const [column, value] = call.args as [keyof ApplicationRow, string];

        if (call.method === 'eq') {
          return row[column] === value;
        }
        if (call.method === 'ilike') {
          const needle = value.replaceAll('%', '').toLowerCase();
          return String(row[column] ?? '').toLowerCase().includes(needle);
        }
        if (call.method === 'gte') {
          const rowValue = row[column];
          return typeof rowValue === 'string' && rowValue >= value;
        }
        if (call.method === 'lte') {
          const rowValue = row[column];
          return typeof rowValue === 'string' && rowValue <= value;
        }
        return true;
      }),
    );
  }

  private applyOrdering(rows: ApplicationRow[]): ApplicationRow[] {
    const orderCall = this.calls.find((call) => call.method === 'order');
    if (!orderCall) return rows;

    const [column, options] = orderCall.args as [keyof ApplicationRow, { ascending: boolean }];
    return [...rows].sort((left, right) => {
      const leftValue = String(left[column] ?? '');
      const rightValue = String(right[column] ?? '');
      return options.ascending
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    });
  }
}

function createMockDb(query: ApplicationsQuery) {
  return {
    from: vi.fn((table: string) => {
      expect(table).toBe('applications');
      return query;
    }),
  };
}

describe('GET /api/applications', () => {
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

  it('paginates 26 records with limit=25 into page 1 with 25 items and totalPages=2', async () => {
    const rows = Array.from({ length: 26 }, (_, index) => ({
      id: `app-${index + 1}`,
      company: `Company ${index + 1}`,
      applied_date: '2025-01-01',
    }));
    const query = new ApplicationsQuery(rows);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?page=1&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[]; total: number; page: number; totalPages: number };

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(25);
    expect(body.total).toBe(26);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(2);
    expect(query.calls).toContainEqual({ method: 'range', args: [0, 24] });
  });

  it('returns radar-sourced applications in the application list', async () => {
    const query = new ApplicationsQuery([{
      id: 'radar-app-1',
      company: 'Acme',
      applied_date: null,
      source: 'radar',
      source_metadata: { discovered_posting_id: 'posting-1' },
    }]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      id: 'radar-app-1',
      source: 'radar',
      source_metadata: { discovered_posting_id: 'posting-1' },
    });
  });

  it('filters applied_date by inclusive date_from and date_to bounds', async () => {
    const query = new ApplicationsQuery([
      { id: 'before', company: 'Before', applied_date: '2024-12-31' },
      { id: 'from', company: 'From', applied_date: '2025-01-01' },
      { id: 'inside', company: 'Inside', applied_date: '2025-06-15' },
      { id: 'to', company: 'To', applied_date: '2025-12-31' },
      { id: 'after', company: 'After', applied_date: '2026-01-01' },
      { id: 'no-date', company: 'No Date', applied_date: null },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?date_from=2025-01-01&date_to=2025-12-31&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[]; total: number };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual(['from', 'inside', 'to']);
    expect(body.total).toBe(3);
    expect(query.calls).toContainEqual({ method: 'gte', args: ['applied_date', '2025-01-01'] });
    expect(query.calls).toContainEqual({ method: 'lte', args: ['applied_date', '2025-12-31'] });
  });

  it('does not add date filters when no date params are supplied', async () => {
    const query = new ApplicationsQuery([
      { id: 'old', company: 'Old', applied_date: '2021-01-01' },
      { id: 'current', company: 'Current', applied_date: '2025-06-20' },
      { id: 'future', company: 'Future', applied_date: '2026-05-12' },
      { id: 'no-date', company: 'No Date', applied_date: null },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual([
      'old',
      'current',
      'future',
      'no-date',
    ]);
    expect(query.calls.some((call) => call.method === 'gte' || call.method === 'lte')).toBe(false);
  });

  it('sorts by company name when requested', async () => {
    const query = new ApplicationsQuery([
      { id: 'charlie', company: 'Charlie Co', applied_date: '2026-01-03' },
      { id: 'alpha', company: 'Alpha Co', applied_date: '2026-01-01' },
      { id: 'bravo', company: 'Bravo Co', applied_date: '2026-01-02' },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?sort=company_asc&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual(['alpha', 'bravo', 'charlie']);
    expect(query.calls).toContainEqual({ method: 'order', args: ['company', { ascending: true }] });
  });

  it('sorts by applied date when requested', async () => {
    const query = new ApplicationsQuery([
      { id: 'first', company: 'First Co', applied_date: '2026-01-01' },
      { id: 'third', company: 'Third Co', applied_date: '2026-03-01' },
      { id: 'second', company: 'Second Co', applied_date: '2026-02-01' },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?sort=applied_desc&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual(['third', 'second', 'first']);
    expect(query.calls).toContainEqual({ method: 'order', args: ['applied_date', { ascending: false }] });
  });

  it('sorts by date added when requested', async () => {
    const query = new ApplicationsQuery([
      { id: 'older', company: 'Older Co', applied_date: null, added: '2026-01-01' },
      { id: 'newer', company: 'Newer Co', applied_date: null, added: '2026-03-01' },
      { id: 'middle', company: 'Middle Co', applied_date: null, added: '2026-02-01' },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?sort=added_asc&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual(['older', 'middle', 'newer']);
    expect(query.calls).toContainEqual({ method: 'order', args: ['added', { ascending: true }] });
  });

  it('sorts by status when requested', async () => {
    const query = new ApplicationsQuery([
      { id: 'screening', company: 'Screening Co', applied_date: null, status: 'screening' },
      { id: 'applied', company: 'Applied Co', applied_date: null, status: 'applied' },
      { id: 'offered', company: 'Offered Co', applied_date: null, status: 'offered' },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?sort=status_asc&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual(['applied', 'offered', 'screening']);
    expect(query.calls).toContainEqual({ method: 'order', args: ['status', { ascending: true }] });
  });

  it('sorts by location when requested', async () => {
    const query = new ApplicationsQuery([
      { id: 'sf', company: 'SF Co', applied_date: null, location: 'San Francisco, CA' },
      { id: 'la', company: 'LA Co', applied_date: null, location: 'Los Angeles, CA' },
      { id: 'ny', company: 'NY Co', applied_date: null, location: 'New York, NY' },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/applications?sort=location_desc&limit=25')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: ApplicationRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row: ApplicationRow) => row.id)).toEqual(['sf', 'ny', 'la']);
    expect(query.calls).toContainEqual({ method: 'order', args: ['location', { ascending: false }] });
  });
});
