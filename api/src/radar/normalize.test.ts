import { describe, expect, it } from 'vitest';
import { detectRemoteStatus, normalizeLocation } from './normalize';

describe('radar location normalization', () => {
  it('normalizes empty and whitespace-only locations to null', () => {
    expect(normalizeLocation(undefined)).toBeNull();
    expect(normalizeLocation('   ')).toBeNull();
  });

  it('collapses internal whitespace', () => {
    expect(normalizeLocation('Remote   -   United States')).toBe('Remote - United States');
  });

  it('detects remote US locations', () => {
    expect(detectRemoteStatus('Remote - United States')).toBe('remote_us');
    expect(detectRemoteStatus('Remote, US')).toBe('remote_us');
  });

  it('detects Los Angeles locations before generic onsite', () => {
    expect(detectRemoteStatus('Los Angeles, CA')).toBe('la');
    expect(detectRemoteStatus('Remote - Los Angeles')).toBe('la');
  });

  it('detects onsite and unknown locations', () => {
    expect(detectRemoteStatus('New York, NY')).toBe('onsite');
    expect(detectRemoteStatus(null)).toBe('unknown');
    expect(detectRemoteStatus('Remote - Canada')).toBe('unknown');
  });
});
