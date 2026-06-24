import { describe, expect, it } from 'vitest';
import { qualityScore } from './qualityScore';

describe('qualityScore', () => {
  it('scores direct live postings above aggregator unchecked postings', () => {
    const directLive = qualityScore({
      source_tier: 'direct_ats',
      validity_status: 'live',
      first_seen_at: new Date().toISOString(),
    });
    const aggregatorUnchecked = qualityScore({
      source_tier: 'aggregator',
      validity_status: 'unchecked',
      first_seen_at: new Date().toISOString(),
    });

    expect(directLive).toBeGreaterThan(aggregatorUnchecked);
  });

  it('penalizes closed postings heavily', () => {
    expect(qualityScore({
      source_tier: 'direct_ats',
      validity_status: 'closed',
      first_seen_at: new Date().toISOString(),
    })).toBeLessThan(qualityScore({
      source_tier: 'curated_board',
      validity_status: 'unchecked',
      first_seen_at: new Date().toISOString(),
    }));
  });
});
