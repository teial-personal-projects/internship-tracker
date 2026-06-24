import { afterEach, describe, expect, it, vi } from 'vitest';
import { validatePostingFromSource } from './validatePosting';
import { getAtsAdapter } from './adapters/registry';

vi.mock('./adapters/registry', () => ({
  getAtsAdapter: vi.fn(),
}));

type Row = Record<string, unknown>;

class Query {
  private readonly filters: Array<[string, string]> = [];
  private updatePayload: Row | null = null;

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

  update(payload: Row) {
    this.updatePayload = payload;
    return this;
  }

  async single() {
    return { data: this.filterRows()[0] ?? null, error: null };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
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

describe('validatePostingFromSource', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates validation fields when adapter validation returns closed', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn(),
      validate: vi.fn().mockResolvedValue({ status: 'closed', error: null }),
    });
    const db = createMockDb({
      discovered_postings: [{
        id: 'posting-1',
        validity_status: 'unchecked',
        last_validated_at: null,
        validation_error: null,
      }],
      company_watchlist: [{
        id: 'watchlist-1',
        ats_type: 'greenhouse',
        ats_board_token: 'acme',
      }],
    });

    const result = await validatePostingFromSource(db, {
      id: 'posting-1',
      external_job_id: 'job-1',
      title: 'Senior Software Engineer',
      location: 'Remote',
      remote_status: 'remote_us',
      url: 'https://example.com/job-1',
      posted_at: null,
      raw_payload: {},
      watchlist_id: 'watchlist-1',
      source_tier: 'direct_ats',
    });

    expect(result).toEqual({ attempted: true, status: 'closed', error: null });
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      validity_status: 'closed',
      validation_error: null,
      last_validated_at: expect.any(String),
    });
  });

  it('stores validation errors without treating them as closed', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn(),
      validate: vi.fn().mockResolvedValue({ status: 'error', error: 'Network failed' }),
    });
    const db = createMockDb({
      discovered_postings: [{
        id: 'posting-1',
        validity_status: 'unchecked',
        last_validated_at: null,
        validation_error: null,
      }],
      company_watchlist: [{
        id: 'watchlist-1',
        ats_type: 'greenhouse',
        ats_board_token: 'acme',
      }],
    });

    const result = await validatePostingFromSource(db, {
      id: 'posting-1',
      external_job_id: 'job-1',
      title: 'Senior Software Engineer',
      location: 'Remote',
      remote_status: 'remote_us',
      url: 'https://example.com/job-1',
      posted_at: null,
      raw_payload: {},
      watchlist_id: 'watchlist-1',
      source_tier: 'direct_ats',
    });

    expect(result).toEqual({ attempted: true, status: 'error', error: 'Network failed' });
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      validity_status: 'error',
      validation_error: 'Network failed',
      last_validated_at: expect.any(String),
    });
  });

  it('skips validation for non-direct sources', async () => {
    const db = createMockDb({
      discovered_postings: [],
      company_watchlist: [],
    });

    await expect(validatePostingFromSource(db, {
      id: 'posting-1',
      external_job_id: 'job-1',
      title: 'Senior Software Engineer',
      location: 'Remote',
      remote_status: 'remote_us',
      url: 'https://example.com/job-1',
      posted_at: null,
      raw_payload: {},
      watchlist_id: 'watchlist-1',
      source_tier: 'curated_board',
    })).resolves.toEqual({ attempted: false, status: null, error: null });
    expect(getAtsAdapter).not.toHaveBeenCalled();
  });

  it('skips validation when the posting was validated recently', async () => {
    const db = createMockDb({
      discovered_postings: [],
      company_watchlist: [],
    });

    await expect(validatePostingFromSource(db, {
      id: 'posting-1',
      external_job_id: 'job-1',
      title: 'Senior Software Engineer',
      location: 'Remote',
      remote_status: 'remote_us',
      url: 'https://example.com/job-1',
      posted_at: null,
      raw_payload: {},
      watchlist_id: 'watchlist-1',
      source_tier: 'direct_ats',
      validity_status: 'live',
      last_validated_at: new Date().toISOString(),
    })).resolves.toEqual({ attempted: false, status: 'live', error: null });
    expect(getAtsAdapter).not.toHaveBeenCalled();
  });
});
