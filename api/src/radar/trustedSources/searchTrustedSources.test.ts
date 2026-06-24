import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchTrustedSources } from './searchTrustedSources';
import { getTrustedSourceAdapter } from './registry';
import type { NormalizedPosting } from '../adapters/types';

vi.mock('./registry', () => ({
  getTrustedSourceAdapter: vi.fn(),
}));

type Row = Record<string, unknown> & { id?: string };

class Query {
  private readonly filters: Array<[string, unknown]> = [];
  private insertPayload: Row | null = null;
  private updatePayload: Row | null = null;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  insert(payload: Row) {
    this.insertPayload = payload;
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), { id: `${this.table}-new`, ...payload }];
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
    if (this.insertPayload) return [];
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

function posting(overrides: Partial<NormalizedPosting> = {}): NormalizedPosting {
  return {
    externalId: 'wwr-backend-1',
    companyName: 'Mission School',
    title: 'Backend Engineer',
    location: 'Remote',
    remoteStatus: 'remote_us',
    url: 'https://weworkremotely.com/remote-jobs/mission-school-backend-engineer',
    sourceName: 'We Work Remotely',
    sourceTier: 'curated_board',
    canonicalUrl: 'https://weworkremotely.com/remote-jobs/mission-school-backend-engineer',
    postedAt: '2026-06-01T12:00:00.000Z',
    raw: { match_reasons: ['title "backend engineer"', 'source We Work Remotely'] },
    ...overrides,
  };
}

const USER_ID = '00000000-0000-4000-8000-000000000001';

describe('searchTrustedSources', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('stores source-discovered postings with radar_source_id and nullable watchlist_id', async () => {
    const db = createMockDb({
      radar_sources: [{
        id: 'we_work_remotely',
        source_name: 'We Work Remotely',
        source_tier: 'curated_board',
        is_active: true,
        metadata: {
          trusted_discovery_enabled: true,
          trusted_source_adapter: 'we_work_remotely',
          feed_urls: ['https://example.com/feed.rss'],
        },
      }],
      discovered_postings: [],
    });
    vi.mocked(getTrustedSourceAdapter).mockReturnValue({
      search: vi.fn().mockResolvedValue([posting()]),
    });

    const results = await searchTrustedSources(db.client, USER_ID, {
      user_id: USER_ID,
      title_terms: ['backend engineer'],
      field_terms: ['edtech'],
      include_keywords: [],
      exclude_keywords: ['intern'],
      seniority_terms: [],
      location_rules: ['remote_us'],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(results).toEqual([expect.objectContaining({
      sourceId: 'we_work_remotely',
      fetched: 1,
      matched: 1,
      inserted: 1,
      error: null,
    })]);
    expect(db.rowsByTable.discovered_postings).toContainEqual(expect.objectContaining({
      user_id: USER_ID,
      watchlist_id: null,
      radar_source_id: 'we_work_remotely',
      company_name: 'Mission School',
      external_job_id: 'wwr-backend-1',
      first_seen_source: 'We Work Remotely',
      source_tier: 'curated_board',
    }));
  });

  it('dedupes source-discovered postings against existing fingerprint matches', async () => {
    const db = createMockDb({
      radar_sources: [{
        id: 'we_work_remotely',
        source_name: 'We Work Remotely',
        source_tier: 'curated_board',
        is_active: true,
        metadata: {
          trusted_discovery_enabled: true,
          trusted_source_adapter: 'we_work_remotely',
          feed_urls: ['https://example.com/feed.rss'],
        },
      }],
      discovered_postings: [{
        id: 'existing-posting',
        user_id: USER_ID,
        watchlist_id: 'watchlist-1',
        company_name: 'Mission School',
        external_job_id: 'greenhouse-1',
        title: 'Backend Engineer',
        url: 'https://boards.greenhouse.io/mission/jobs/greenhouse-1',
        source_tier: 'direct_ats',
        first_seen_source: 'Greenhouse',
        also_seen_on: [],
        source_first_seen_at: {},
        raw_payload: {
          canonicalUrl: 'https://weworkremotely.com/remote-jobs/mission-school-backend-engineer',
        },
      }],
    });
    vi.mocked(getTrustedSourceAdapter).mockReturnValue({
      search: vi.fn().mockResolvedValue([posting()]),
    });

    const results = await searchTrustedSources(db.client, USER_ID, {
      user_id: USER_ID,
      title_terms: ['backend engineer'],
      field_terms: ['edtech'],
      include_keywords: [],
      exclude_keywords: ['intern'],
      seniority_terms: [],
      location_rules: ['remote_us'],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(results[0]).toMatchObject({ inserted: 0, matched: 1, error: null });
    expect(db.rowsByTable.discovered_postings).toHaveLength(1);
    expect(db.rowsByTable.discovered_postings[0]).toMatchObject({
      id: 'existing-posting',
      first_seen_source: 'Greenhouse',
      also_seen_on: [expect.objectContaining({
        source_name: 'We Work Remotely',
        source_tier: 'curated_board',
        external_job_id: 'wwr-backend-1',
      })],
    });
  });
});
