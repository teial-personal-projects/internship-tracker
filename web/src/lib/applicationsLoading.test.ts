import { describe, expect, it } from 'vitest';
import {
  getApplicationsPaging,
  GRID_PAGE_LIMIT,
  KANBAN_PAGE_LIMIT,
  shouldShowKanbanLimitHint,
} from './applicationsLoading';

describe('applications loading strategy', () => {
  it('keeps Grid pagination tied to the current URL page', () => {
    expect(getApplicationsPaging('grid', 3)).toEqual({
      page: 3,
      limit: GRID_PAGE_LIMIT,
    });
  });

  it('uses the capped Kanban fetch size from page 1', () => {
    expect(getApplicationsPaging('kanban', 3)).toEqual({
      page: 1,
      limit: KANBAN_PAGE_LIMIT,
    });
  });

  it('shows the Kanban cap hint only when matching records exceed the fetch limit', () => {
    expect(shouldShowKanbanLimitHint('kanban', KANBAN_PAGE_LIMIT)).toBe(false);
    expect(shouldShowKanbanLimitHint('kanban', KANBAN_PAGE_LIMIT + 1)).toBe(true);
    expect(shouldShowKanbanLimitHint('grid', KANBAN_PAGE_LIMIT + 1)).toBe(false);
  });
});
