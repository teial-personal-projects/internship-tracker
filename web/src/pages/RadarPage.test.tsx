import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { DiscoveredPosting } from '@shared/schemas';
import { RadarPage, radarViewParams, splitPostingsByClosedState } from './RadarPage';

vi.mock('@/components/AppHeader', () => ({
  AppHeader: () => <header>Header</header>,
}));

vi.mock('@/pages/WatchlistPage', () => ({
  WatchlistWorkspace: () => <section>Watchlist Workspace</section>,
}));

vi.mock('@/hooks/useWatchlist', () => ({
  useWatchlist: () => ({ data: [] }),
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
      location_rules: ['remote_us', 'la'],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    },
  }),
  useRadarPostings: () => ({ data: [], isLoading: false, error: null }),
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
  it('maps triage views to API filter params', () => {
    expect(radarViewParams('fresh_direct')).toEqual({ source_tier: 'direct_ats', sort: 'quality' });
    expect(radarViewParams('curated')).toEqual({ source_tier: 'curated_board', sort: 'quality' });
    expect(radarViewParams('aggregator')).toEqual({ source_tier: 'aggregator', sort: 'quality' });
    expect(radarViewParams('live_only')).toEqual({ validity_status: 'live', sort: 'quality' });
    expect(radarViewParams('closed')).toEqual({ validity_status: 'closed', sort: 'first_seen' });
    expect(radarViewParams('all')).toEqual({ sort: 'quality', include_closed: true });
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

  it('renders the watchlist workspace below Radar results', () => {
    const markup = renderToStaticMarkup(<RadarPage />);

    expect(markup.indexOf('Radar results')).toBeLessThan(markup.indexOf('Companies to watch'));
    expect(markup.indexOf('No matched postings yet')).toBeLessThan(markup.indexOf('Watchlist Workspace'));
  });

  it('renders trusted discovery criteria controls before results', () => {
    const markup = renderToStaticMarkup(<RadarPage />);

    expect(markup).toContain('Target titles');
    expect(markup).toContain('Fields or industries');
    expect(markup).toContain('Search trusted sources');
    expect(markup.indexOf('Search trusted sources')).toBeLessThan(markup.indexOf('New</p>'));
  });
});
