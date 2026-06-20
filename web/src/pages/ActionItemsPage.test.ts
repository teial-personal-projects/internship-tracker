import { describe, expect, it } from 'vitest';
import type { Task } from '@/api/tasks.api';
import { getRecentDoneTasks } from './ActionItemsPage';

function makeTask(id: string, updatedAt: string): Task {
  return {
    id,
    user_id: 'user-1',
    title: `Task ${id}`,
    category: 'application',
    priority: 'medium',
    status: 'complete',
    due_date: null,
    application_id: null,
    contact_id: null,
    notes: null,
    is_auto_generated: false,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: updatedAt,
  };
}

describe('getRecentDoneTasks', () => {
  it('returns the most recently updated done tasks first with a limit', () => {
    expect(getRecentDoneTasks([
      makeTask('older', '2026-06-01T00:00:00.000Z'),
      makeTask('newer', '2026-06-03T00:00:00.000Z'),
      makeTask('middle', '2026-06-02T00:00:00.000Z'),
    ], 2).map((task) => task.id)).toEqual(['newer', 'middle']);
  });
});
