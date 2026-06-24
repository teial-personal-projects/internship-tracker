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
    private readonly insertErrors: Record<string, string> = {},
    private readonly selectErrors: Record<string, string> = {},
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
    if (!this.insertErrors[this.table]) {
      this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), payload];
    }
    return this;
  }

  update(payload: Row) {
    this.updatePayload = payload;
    return this;
  }

  then(
    resolve: (value: { data: Row[] | null; error: { message: string } | null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    if (this.insertPayload) {
      const insertError = this.insertErrors[this.table];
      return Promise.resolve({
        data: insertError ? null : [this.insertPayload],
        error: insertError ? { message: insertError } : null,
      }).then(resolve, reject);
    }

    if (this.updatePayload) {
      const matched = this.filterRows();
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? []).map((row) =>
        matched.includes(row) ? { ...row, ...this.updatePayload } : row,
      );
      return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
    }

    const selectError = this.selectErrors[this.table];
    return Promise.resolve({
      data: selectError ? null : this.filterRows(),
      error: selectError ? { message: selectError } : null,
    }).then(resolve, reject);
  }

  private filterRows(): Row[] {
    return (this.rowsByTable[this.table] ?? []).filter((row) =>
      this.filters.every(([column, value]) => row[column] === value),
    );
  }
}

function createMockDb(
  rowsByTable: Record<string, Row[]>,
  insertErrors: Record<string, string> = {},
  selectErrors: Record<string, string> = {},
) {
  return {
    rowsByTable,
    from(table: string) {
      return new Query(table, rowsByTable, insertErrors, selectErrors);
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

const softwareEngineerCriteria = {
  user_id: source.user_id,
  title_terms: ['software engineer'],
  field_terms: [],
  include_keywords: [],
  exclude_keywords: [],
  seniority_terms: [],
  location_terms: [],
  location_rules: [],
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
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
      radar_criteria: [softwareEngineerCriteria],
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
      source_tier: 'direct_ats',
      first_seen_source: 'Greenhouse',
      source_first_seen_at: {
        Greenhouse: expect.any(String),
      },
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
      radar_criteria: [],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toEqual({ inserted: 0, matched: 0, fetched: 0, error: 'Bad board token' });
    expect(db.rowsByTable.discovered_postings).toHaveLength(0);
    expect(db.rowsByTable.company_watchlist[0].last_refreshed_at).toBeNull();
  });

  it('returns a source error instead of throwing when inserting a posting fails', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockResolvedValue([matchedPosting]),
    });
    const db = createMockDb({
      discovered_postings: [],
      radar_criteria: [softwareEngineerCriteria],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    }, {
      discovered_postings: 'insert failed',
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toEqual({ inserted: 0, matched: 1, fetched: 1, error: 'insert failed' });
    expect(db.rowsByTable.discovered_postings).toHaveLength(0);
    expect(db.rowsByTable.company_watchlist[0].last_refreshed_at).toBeNull();
  });

  it('does not match postings when the optional radar_criteria table is missing', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockResolvedValue([matchedPosting]),
    });
    const db = createMockDb({
      discovered_postings: [],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    }, {}, {
      radar_criteria: "Could not find the table 'public.radar_criteria' in the schema cache",
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toMatchObject({ inserted: 0, matched: 0, fetched: 1, error: null });
    expect(db.rowsByTable.discovered_postings).toHaveLength(0);
    expect(db.rowsByTable.company_watchlist[0].last_refreshed_at).toEqual(expect.any(String));
  });

  it('keeps a bad source isolated so a later source can still refresh', async () => {
    vi.mocked(getAtsAdapter)
      .mockReturnValueOnce({
        fetch: vi.fn().mockRejectedValue(new Error('Bad board token')),
      })
      .mockReturnValueOnce({
        fetch: vi.fn().mockResolvedValue([matchedPosting]),
      });
    const db = createMockDb({
      discovered_postings: [],
      radar_criteria: [softwareEngineerCriteria],
      company_watchlist: [
        { id: 'bad-watchlist', last_refreshed_at: null },
        { id: 'good-watchlist', last_refreshed_at: null },
      ],
    });

    const bad = await refreshRadarSource(db, { ...source, id: 'bad-watchlist' });
    const good = await refreshRadarSource(db, { ...source, id: 'good-watchlist' });

    expect(bad).toEqual({ inserted: 0, matched: 0, fetched: 0, error: 'Bad board token' });
    expect(good).toMatchObject({ inserted: 1, matched: 1, fetched: 1, error: null });
    expect(db.rowsByTable.discovered_postings).toHaveLength(1);
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      watchlist_id: 'good-watchlist',
      external_job_id: 'job-1',
    });
  });

  it('uses per-user criteria when present', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockResolvedValue([{
        ...matchedPosting,
        externalId: 'job-2',
        title: 'Lead Platform Engineer',
        remoteStatus: 'onsite',
        location: 'New York, NY',
      }]),
    });
    const db = createMockDb({
      discovered_postings: [],
      radar_criteria: [{
        user_id: source.user_id,
        title_terms: ['platform engineer'],
        field_terms: ['edtech'],
        include_keywords: ['platform'],
        exclude_keywords: [],
        seniority_terms: [],
        location_terms: [],
        location_rules: ['onsite'],
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      }],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toMatchObject({ inserted: 1, matched: 1, fetched: 1, error: null });
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      external_job_id: 'job-2',
      remote_status: 'onsite',
    });
  });

  it('appends provenance instead of inserting when a canonical fingerprint already exists', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockResolvedValue([{
        ...matchedPosting,
        canonicalUrl: 'https://boards.greenhouse.io/acme/jobs/123',
        companyDomain: 'acme.com',
      }]),
    });
    const db = createMockDb({
      discovered_postings: [{
        id: 'existing-posting',
        user_id: source.user_id,
        watchlist_id: source.id,
        company_name: 'Acme, Inc.',
        external_job_id: 'linkedin-123',
        title: 'Software Engineer',
        location: 'Remote',
        remote_status: 'remote_us',
        url: 'https://linkedin.com/jobs/view/linkedin-123',
        posted_at: null,
        first_seen_at: '2026-06-01T00:00:00.000Z',
        status: 'new',
        source_tier: 'curated_board',
        first_seen_source: 'LinkedIn',
        also_seen_on: [],
        source_first_seen_at: {
          LinkedIn: '2026-06-01T00:00:00.000Z',
        },
        raw_payload: {
          canonicalUrl: 'https://boards.greenhouse.io/acme/jobs/123',
          companyDomain: 'acme.com',
        },
      }],
      radar_criteria: [softwareEngineerCriteria],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toMatchObject({ inserted: 0, matched: 1, fetched: 1, error: null });
    expect(db.rowsByTable.discovered_postings).toHaveLength(1);
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      id: 'existing-posting',
      external_job_id: 'job-1',
      url: 'https://example.com/job-1',
      source_tier: 'direct_ats',
      first_seen_source: 'LinkedIn',
      first_seen_at: '2026-06-01T00:00:00.000Z',
      also_seen_on: [{
        source_name: 'Greenhouse',
        source_tier: 'direct_ats',
        external_job_id: 'job-1',
        url: 'https://example.com/job-1',
      }],
      source_first_seen_at: {
        LinkedIn: '2026-06-01T00:00:00.000Z',
        Greenhouse: expect.any(String),
      },
    });
  });

  it('keeps a direct ATS posting canonical after a later lower-tier fingerprint match', async () => {
    vi.mocked(getAtsAdapter).mockReturnValue({
      fetch: vi.fn().mockResolvedValue([{
        ...matchedPosting,
        sourceName: 'LinkedIn',
        sourceTier: 'curated_board',
        externalId: 'linkedin-123',
        url: 'https://linkedin.com/jobs/view/linkedin-123',
        canonicalUrl: 'https://boards.greenhouse.io/acme/jobs/123',
        companyDomain: 'acme.com',
      }]),
    });
    const db = createMockDb({
      discovered_postings: [{
        id: 'existing-posting',
        user_id: source.user_id,
        watchlist_id: source.id,
        company_name: 'Acme',
        external_job_id: 'job-1',
        title: 'Senior Software Engineer',
        location: 'Remote',
        remote_status: 'remote_us',
        url: 'https://boards.greenhouse.io/acme/jobs/123',
        posted_at: null,
        first_seen_at: '2026-06-01T00:00:00.000Z',
        status: 'new',
        source_tier: 'direct_ats',
        first_seen_source: 'Greenhouse',
        also_seen_on: [],
        source_first_seen_at: {
          Greenhouse: '2026-06-01T00:00:00.000Z',
        },
        raw_payload: {
          canonicalUrl: 'https://boards.greenhouse.io/acme/jobs/123',
          companyDomain: 'acme.com',
        },
      }],
      radar_criteria: [softwareEngineerCriteria],
      company_watchlist: [{ id: source.id, last_refreshed_at: null }],
    });

    const result = await refreshRadarSource(db, source);

    expect(result).toMatchObject({ inserted: 0, matched: 1, fetched: 1, error: null });
    expect(db.rowsByTable.discovered_postings).toHaveLength(1);
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      external_job_id: 'job-1',
      url: 'https://boards.greenhouse.io/acme/jobs/123',
      source_tier: 'direct_ats',
      first_seen_source: 'Greenhouse',
      also_seen_on: [{
        source_name: 'LinkedIn',
        source_tier: 'curated_board',
        external_job_id: 'linkedin-123',
        url: 'https://linkedin.com/jobs/view/linkedin-123',
      }],
      source_first_seen_at: {
        Greenhouse: '2026-06-01T00:00:00.000Z',
        LinkedIn: expect.any(String),
      },
    });
  });
});
