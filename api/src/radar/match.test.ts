import { describe, expect, it } from 'vitest';
import { matches } from './match';
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
  it('allows senior remote roles', () => {
    expect(matches(posting({ title: 'Senior Software Engineer', remoteStatus: 'remote_us' }))).toBe(true);
  });

  it('rejects junior or intern roles even when remote', () => {
    expect(matches(posting({ title: 'Junior Software Engineer' }))).toBe(false);
    expect(matches(posting({ title: 'Senior Software Engineer Intern' }))).toBe(false);
  });

  it('rejects senior onsite roles outside LA', () => {
    expect(matches(posting({ title: 'Senior Software Engineer', remoteStatus: 'onsite', location: 'New York, NY' }))).toBe(false);
  });
});
