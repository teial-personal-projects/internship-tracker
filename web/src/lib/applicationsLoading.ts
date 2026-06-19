import type { ApplicationsView } from './applicationsView';

export const GRID_PAGE_LIMIT = 25;
export const KANBAN_PAGE_LIMIT = 100;

export function getApplicationsPaging(view: ApplicationsView, page: number) {
  if (view === 'kanban') {
    return { page: 1, limit: KANBAN_PAGE_LIMIT };
  }

  return { page, limit: GRID_PAGE_LIMIT };
}

export function shouldShowKanbanLimitHint(view: ApplicationsView, total: number) {
  return view === 'kanban' && total > KANBAN_PAGE_LIMIT;
}
