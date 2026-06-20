import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTodaySummary } from './todaySummary';

const TODAY = '2026-06-18T16:00:00.000Z';

function createPayload({
  interviews = 0,
  openTasks = 0,
  overdueFollowUps = 0,
}: {
  interviews?: number;
  openTasks?: number;
  overdueFollowUps?: number;
}) {
  return {
    up_next: Array.from({ length: interviews }, (_, index) => ({
      scheduled_at: `2026-06-18T1${index}:00:00.000Z`,
    })),
    stats: { open_tasks: openTasks },
    overdue_follow_ups: Array.from({ length: overdueFollowUps }, (_, index) => ({
      id: `contact-${index}`,
    })),
  };
}

describe('buildTodaySummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TODAY));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('omits zero-value clauses', () => {
    expect(buildTodaySummary(createPayload({ openTasks: 2 }))).toBe('You have 2 action items.');
  });

  it('joins non-zero clauses with readable grammar', () => {
    expect(buildTodaySummary(createPayload({ interviews: 1, openTasks: 2, overdueFollowUps: 1 })))
      .toBe('You have 1 interview today, 2 action items, and 1 overdue follow-up.');
  });

  it('returns the caught-up summary when every source is empty', () => {
    expect(buildTodaySummary(createPayload({}))).toBe("You're all caught up. Nothing needs you today.");
  });
});
