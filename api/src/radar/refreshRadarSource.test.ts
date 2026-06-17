import { afterEach, describe, expect, it, vi } from 'vitest';
import { refreshRadarSource } from './refreshRadarSource';
import { getAtsAdapter } from './adapters/registry';
import type { NormalizedPosting } from './adapters/types';

vi.mock('./adapters/registry', () => ({
  getAtsAdapter: vi.fn(),
}));

type Row = Record<string, unknown>;

class Query {
  private filters: Array<[string, string | boolean]> = [];
  private insertPayload: Row | null = null;
  private updatePayload: Row | null = null;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: string | boolean) {
    this.filters.push([column, value]);
    return this;
  }

  insert(payload: Row) {
    this.insertPayload = payload;
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), payload];
    return this;
  }

  update(payload: Row) {
    this.updatePayload = payload;
    return this;
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    if (this.insertPayload) {
      return Promise.resolve({ data: [this.insertPayload], error: null }).then(resolve, reject);
    }

    if (this.updatePayload) {
      const matched = this.filterRows();
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? []).map((row) =>
        matched.includes(row) ? { ...row, ...this.updatePayload } : row,
      );
      return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
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
    from(table: string) {
      return new Query(table, rowsByTable);
    },
  };
}

const matchedPosting: NormalizedPosting = {
  externalId: 'job-1',
  title: 'Senior Software Engineer',
  location: 'Remote - United States',
  remoteStatus: 'remote_us',
  url: 'https://example.com/job-1',
  postedAt: '2026-06-01T12:00:00.000Z',
  raw: { id: 'job-1' },
};

const source = {
  id: 'watchlist-1',
  user_id: 'user-1',
  company_name: 'Acme',
  ats_type: 'greenhouse' as const,
  ats_board_token: 'acme',
  radar_enabled: true,
};

describe('refreshRadarSource', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a new matching external_job_id with status new and skips it on repeat refresh', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockResolvedValue([matchedPosting]),
    });
    const db = createMockDb({
      discovered_postings: [],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    });

    const first = await refreshRadarSource(db, source);
    const second = await refreshRadarSource(db, source);

    expect(first).toMatchObject({ inserted: 1, matched: 1, fetched: 1, error: null });
    expect(second).toMatchObject({ inserted: 0, matched: 1, fetched: 1, error: null });
    expect(db.rowsByTable.discovered_postings).toHaveLength(1);
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      user_id: 'user-1',
      watchlist_id: 'watchlist-1',
      company_name: 'Acme',
      external_job_id: 'job-1',
      status: 'new',
    });
    expect(db.rowsByTable.company_watchlist[0].last_refreshed_at).toEqual(expect.any(String));
  });

  it('returns an error for a bad source and does not insert partial data', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockRejectedValue(new Error('Bad board token')),
    });
    const db = createMockDb({
      discovered_postings: [],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toEqual({ inserted: 0, matched: 0, fetched: 0, error: 'Bad board token' });
    expect(db.rowsByTable.discovered_postings).toHaveLength(0);
    expect(db.rowsByTable.company_watchlist[0].last_refreshed_at).toBeNull();
  });
});
