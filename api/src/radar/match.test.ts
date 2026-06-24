import { describe, expect, it } from 'vitest';
import { criteriaFromRow, matches } from './match';
import type { NormalizedPosting } from './adapters/types';

function posting(overrides: Partial<NormalizedPosting>): NormalizedPosting {
  return {
    externalId: 'posting-1',
    title: 'Senior Software Engineer',
    location: 'Remote - United States',
    remoteStatus: 'remote_us',
    url: 'https://example.com/job',
    postedAt: null,
    raw: {},
    ...overrides,
  };
}

describe('radar match filter', () => {
  it('allows target software engineering titles', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['software engineer'],
      field_terms: [],
      include_keywords: [],
      exclude_keywords: [],
      seniority_terms: [],
      location_terms: [],
      location_rules: [],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(matches(posting({ title: 'Software Engineer', remoteStatus: 'remote_us' }), criteria)).toBe(true);
  });

  it('does not require a hard-coded default location', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['backend engineer'],
      field_terms: [],
      include_keywords: [],
      exclude_keywords: [],
      seniority_terms: [],
      location_terms: [],
      location_rules: [],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(matches(posting({
      title: 'Backend Engineer',
      remoteStatus: 'la',
      location: 'Los Angeles, CA',
    }), criteria)).toBe(true);
  });

  it('allows custom location terms when configured', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['backend engineer'],
      field_terms: [],
      include_keywords: [],
      exclude_keywords: [],
      seniority_terms: [],
      location_terms: ['Los Angeles'],
      location_rules: ['remote_us'],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(matches(posting({
      title: 'Backend Engineer',
      remoteStatus: 'la',
      location: 'Los Angeles, CA',
    }), criteria)).toBe(true);
  });

  it('rejects junior or intern roles even when remote', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['software engineer'],
      field_terms: [],
      include_keywords: [],
      exclude_keywords: ['junior', 'intern'],
      seniority_terms: [],
      location_terms: ['Remote'],
      location_rules: [],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(matches(posting({ title: 'Junior Software Engineer' }), criteria)).toBe(false);
    expect(matches(posting({ title: 'Senior Software Engineer Intern' }), criteria)).toBe(false);
  });

  it('does not restore default title or exclude terms after criteria are cleared', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: [],
      field_terms: [],
      include_keywords: [],
      exclude_keywords: [],
      seniority_terms: [],
      location_terms: ['Remote'],
      location_rules: [],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(criteria.titleTerms).toEqual([]);
    expect(criteria.fieldTerms).toEqual([]);
    expect(criteria.excludedTerms).toEqual([]);
    expect(matches(posting({ title: 'Junior Designer' }), criteria)).toBe(true);
  });

  it('rejects onsite roles outside allowed locations', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['software engineer'],
      field_terms: [],
      include_keywords: [],
      exclude_keywords: [],
      seniority_terms: [],
      location_terms: [],
      location_rules: ['remote_us'],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(matches(posting({ title: 'Software Engineer', remoteStatus: 'onsite', location: 'New York, NY' }), criteria)).toBe(false);
  });

  it('applies per-user title terms, include keywords, and location rules', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['platform engineer'],
      field_terms: ['edtech'],
      include_keywords: ['platform'],
      exclude_keywords: ['manager'],
      seniority_terms: [],
      location_terms: [],
      location_rules: ['onsite'],
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    });

    expect(matches(posting({
      title: 'Platform Engineer',
      remoteStatus: 'onsite',
      location: 'New York, NY',
    }), criteria)).toBe(true);
    expect(matches(posting({
      title: 'Product Engineer',
      remoteStatus: 'onsite',
      location: 'New York, NY',
    }), criteria)).toBe(false);
  });

  it('does not match anything when no criteria row exists', () => {
    expect(matches(posting({ title: 'Software Engineer' }), criteriaFromRow(null))).toBe(false);
  });
});
