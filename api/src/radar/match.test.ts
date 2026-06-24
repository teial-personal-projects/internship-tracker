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
    expect(matches(posting({ title: 'Software Engineer', remoteStatus: 'remote_us' }))).toBe(true);
  });

  it('allows target Los Angeles roles', () => {
    expect(matches(posting({
      title: 'Backend Engineer',
      remoteStatus: 'la',
      location: 'Los Angeles, CA',
    }))).toBe(true);
  });

  it('rejects junior or intern roles even when remote', () => {
    expect(matches(posting({ title: 'Junior Software Engineer' }))).toBe(false);
    expect(matches(posting({ title: 'Senior Software Engineer Intern' }))).toBe(false);
  });

  it('rejects onsite roles outside allowed locations', () => {
    expect(matches(posting({ title: 'Software Engineer', remoteStatus: 'onsite', location: 'New York, NY' }))).toBe(false);
  });

  it('applies per-user title terms, include keywords, and location rules', () => {
    const criteria = criteriaFromRow({
      user_id: '00000000-0000-4000-8000-000000000001',
      title_terms: ['platform engineer'],
      field_terms: ['edtech'],
      include_keywords: ['platform'],
      exclude_keywords: ['manager'],
      seniority_terms: [],
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

  it('falls back to trusted discovery defaults when no criteria row exists', () => {
    expect(matches(posting({ title: 'Software Engineer' }), criteriaFromRow(null))).toBe(true);
  });
});
