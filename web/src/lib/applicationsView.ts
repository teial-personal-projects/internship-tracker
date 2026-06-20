export type ApplicationsView = 'grid' | 'kanban';

export function getApplicationsView(value: string | null): ApplicationsView {
  return value === 'kanban' ? 'kanban' : 'grid';
}

export function setApplicationsViewParam(params: URLSearchParams, view: ApplicationsView) {
  const next = new URLSearchParams(params);
  next.set('view', view);
  return next;
}
