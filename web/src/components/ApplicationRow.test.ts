import { describe, expect, it } from 'vitest';
import { getAppliedDateLabel } from './ApplicationRow';

describe('ApplicationRow', () => {
  it('uses "Not applied" for a null applied_date', () => {
    expect(getAppliedDateLabel(null)).toBe('Not applied');
  });
});
