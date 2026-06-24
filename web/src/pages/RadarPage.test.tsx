import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiscoveredPosting } from '@shared/schemas';
import { RadarPage, hasFormSearchAnchor, radarViewParams, splitPostingsByClosedState } from './RadarPage';

const mockRadarPostings = vi.hoisted(() => ({
  value: [] as DiscoveredPosting[],
}));

const mockWatchlist = vi.hoisted(() => ({
  value: [] as Array<{ id: string; company_name: string; industry?: string | null; ats_type?: string | null }>,
}));

vi.mock('@/components/AppHeader', () => ({
  AppHeader: () => <header>Header</header>,
}));

vi.mock('@/hooks/useWatchlist', () => ({
  useWatchlist: () => ({ data: mockWatchlist.value }),
}));

vi.mock('@/hooks/useRadar', () => ({
  useRadarCriteria: () => ({
    data: {
      user_id: '22222222-2222-4222-8222-222222222222',
      title_terms: ['software engineer', 'backend engineer'],
      field_terms: ['edtech', 'civic tech'],
      include_keywords: [],
      exclude_keywords: ['junior', 'intern'],
      seniority_terms: [],
      location_terms: ['New York'],
      location_rules: [],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    },
  }),
  useRadarSearchSources: () => ({
    data: [
      {
        id: 'linkedin',
        source_name: 'LinkedIn',
        source_tier: 'curated_board',
        is_active: true,
        is_searchable: false,
      },
      {
        id: 'idealist',
        source_name: 'Idealist',
        source_tier: 'curated_board',
        is_active: false,
        is_searchable: false,
      },
    ],
  }),
  useRadarPostings: () => ({ data: mockRadarPostings.value, isLoading: false, error: null }),
  useSaveRadarPostingCompany: () => ({ mutateAsync: vi.fn() }),
  useSearchTrustedSources: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRadarCriteria: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRadarPostingStatus: () => ({ mutateAsync: vi.fn() }),
}));

function posting(overrides: Partial<DiscoveredPosting>): DiscoveredPosting {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: '22222222-2222-4222-8222-222222222222',
    watchlist_id: '33333333-3333-4333-8333-333333333333',
    company_name: 'Acme',
    external_job_id: 'job-1',
    title: 'Senior Software Engineer',
    location: 'Remote',
    remote_status: 'remote_us',
    url: 'https://example.com/job',
    posted_at: null,
    first_seen_at: '2026-06-01T00:00:00.000Z',
    status: 'new',
    source_tier: 'direct_ats',
    first_seen_source: 'Greenhouse',
    also_seen_on: [],
    source_first_seen_at: {},
    validity_status: 'unchecked',
    last_validated_at: null,
    validation_error: null,
    raw_payload: {},
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('RadarPage helpers', () => {
  beforeEach(() => {
    mockRadarPostings.value = [];
    mockWatchlist.value = [];
  });

  it('maps triage views to API filter params', () => {
    expect(radarViewParams('job_boards')).toEqual({ source_tier: 'curated_board', sort: 'quality' });
    expect(radarViewParams('live_only')).toEqual({ source_tier: 'curated_board', validity_status: 'live', sort: 'quality' });
    expect(radarViewParams('closed')).toEqual({ source_tier: 'curated_board', validity_status: 'closed', sort: 'first_seen' });
    expect(radarViewParams('all')).toEqual({ source_tier: 'curated_board', sort: 'quality', include_closed: true });
  });

  it('enables trusted source search from current form title or location criteria', () => {
    expect(hasFormSearchAnchor('', '', [])).toBe(false);
    expect(hasFormSearchAnchor('software engineer', '', [])).toBe(true);
    expect(hasFormSearchAnchor('', 'Los Angeles, CA', [])).toBe(true);
    expect(hasFormSearchAnchor('', '', ['remote_us'])).toBe(true);
  });

  it('splits closed postings from active postings', () => {
    const split = splitPostingsByClosedState([
      posting({ id: 'live-posting', validity_status: 'live' }),
      posting({ id: 'closed-posting', validity_status: 'closed' }),
      posting({ id: 'missing-posting', validity_status: 'not_found' }),
    ]);

    expect(split.activePostings.map((item) => item.id)).toEqual(['live-posting']);
    expect(split.closedPostings.map((item) => item.id)).toEqual(['closed-posting', 'missing-posting']);
  });

  it('keeps job search separate from the companies-to-watch workspace', () => {
    const markup = renderToStaticMarkup(<RadarPage />);

    expect(markup).toContain('Job Search');
    expect(markup).toContain('Job-board results');
    expect(markup).not.toContain('Companies to watch');
    expect(markup).not.toContain('Watchlist Workspace');
  });

  it('renders trusted discovery criteria controls before results', () => {
    const markup = renderToStaticMarkup(<RadarPage />);

    expect(markup).toContain('Target titles');
    expect(markup).toContain('Fields or industries');
    expect(markup).toContain('Job-board search criteria');
    expect(markup).toContain('No job boards connected');
    expect(markup).toContain('Job-board source status');
    expect(markup).toContain('LinkedIn');
    expect(markup).toContain('No connected job-board sources');
    expect(markup).toContain('Listed but not connected');
    expect(markup).toContain('targeted job-board search cannot run yet');
    expect(markup).not.toContain('Search job boards');
    expect(markup).not.toContain('All companies');
  });

  it('renders source tier, validity, original posting link, save company, and provenance on Radar cards', () => {
    mockRadarPostings.value = [posting({
      id: 'curated-posting',
      company_name: 'Mission School',
      title: 'Backend Engineer',
      url: 'https://example.com/jobs/mission-school-backend-engineer',
      source_tier: 'curated_board',
      first_seen_source: 'Example Trusted Board',
      validity_status: 'live',
      also_seen_on: [{
        source_name: 'Greenhouse',
        source_tier: 'direct_ats',
        external_job_id: 'greenhouse-1',
        url: 'https://boards.greenhouse.io/mission/jobs/1',
      }],
      raw_payload: {
        match_reasons: ['title "backend engineer"', 'source Example Trusted Board'],
      },
    })];

    const markup = renderToStaticMarkup(<RadarPage />);

    expect(markup).toContain('Curated');
    expect(markup).toContain('Live');
    expect(markup).toContain('href="https://example.com/jobs/mission-school-backend-engineer"');
    expect(markup).toContain('Save company');
    expect(markup).not.toContain('Add to tracker');
    expect(markup).toContain('Also seen on Greenhouse');
    expect(markup).toContain('Matched title &quot;backend engineer&quot;');
  });

  it('keeps closed postings out of active presentation and does not render manual validity override controls', () => {
    const split = splitPostingsByClosedState([
      posting({ id: 'active-posting', validity_status: 'live' }),
      posting({ id: 'closed-posting', validity_status: 'closed' }),
    ]);
    const markup = renderToStaticMarkup(<RadarPage />);

    expect(split.activePostings.map((item) => item.id)).toEqual(['active-posting']);
    expect(split.closedPostings.map((item) => item.id)).toEqual(['closed-posting']);
    expect(markup).not.toContain('Mark as still open');
    expect(markup).not.toContain('Still open');
    expect(markup).not.toContain('Override');
  });
});
