import { describe, expect, it } from 'vitest';

import { recalculateChecklist } from './checklist';

describe('recalculateChecklist', () => {
  it('removes recruiter-assisted N/A checklist steps', () => {
    const result = recalculateChecklist(
      {
        step_1: true,
        step_6: true,
        step_9: true,
        step_12: true,
        step_13: true,
      },
      'recruiter_assisted',
    );

    expect(result).toEqual({
      step_1: true,
      step_13: true,
    });
  });

  it('removes referral N/A checklist steps only', () => {
    const result = recalculateChecklist(
      {
        step_1: true,
        step_6: true,
        step_9: true,
        step_12: true,
        step_13: true,
      },
      'referral',
    );

    expect(result).toEqual({
      step_1: true,
      step_6: true,
      step_13: true,
    });
  });

  it('preserves checklist state for types without skipped steps', () => {
    const state = { step_1: true, step_9: true };

    expect(recalculateChecklist(state, 'cold_strategic')).toBe(state);
    expect(recalculateChecklist(state, null)).toBe(state);
  });
});
