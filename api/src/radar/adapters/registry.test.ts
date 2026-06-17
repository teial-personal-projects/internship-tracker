import { describe, expect, it } from 'vitest';
import { AshbyAdapter } from './ashby';
import { GreenhouseAdapter } from './greenhouse';
import { getAtsAdapter } from './registry';

describe('getAtsAdapter', () => {
  it('returns the adapter for a known ATS type', () => {
    expect(getAtsAdapter('greenhouse')).toBeInstanceOf(GreenhouseAdapter);
    expect(getAtsAdapter('ashby')).toBeInstanceOf(AshbyAdapter);
  });

  it('throws a clear error for an unknown ATS type', () => {
    expect(() => getAtsAdapter('unknown')).toThrow('Unsupported ATS type: unknown');
  });
});
