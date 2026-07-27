import { describe, expect, it } from 'vitest';
import { getAppliedDateForStatusChange } from './applicationAppliedDate';

describe('getAppliedDateForStatusChange', () => {
  it('sets today when the status changes to applied', () => {
    expect(getAppliedDateForStatusChange({
      previousStatus: 'in_progress',
      nextStatus: 'applied',
      currentAppliedDate: null,
      today: '2026-07-27',
    })).toBe('2026-07-27');
  });

  it('preserves the original date when an applied application is edited', () => {
    expect(getAppliedDateForStatusChange({
      previousStatus: 'applied',
      nextStatus: 'applied',
      currentAppliedDate: '2026-07-20',
      today: '2026-07-27',
    })).toBe('2026-07-20');
  });

  it('does not add an applied date for another status', () => {
    expect(getAppliedDateForStatusChange({
      previousStatus: 'not_started',
      nextStatus: 'in_progress',
      currentAppliedDate: undefined,
      today: '2026-07-27',
    })).toBeUndefined();
  });
});
