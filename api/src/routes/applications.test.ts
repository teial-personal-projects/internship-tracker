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
  status?: string;
  application_type?: string | null;
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
    const filteredRows = this.applyFilters();
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
});
