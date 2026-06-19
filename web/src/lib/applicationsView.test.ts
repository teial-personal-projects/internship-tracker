import { describe, expect, it } from 'vitest';
import { getApplicationsView, setApplicationsViewParam } from './applicationsView';

describe('applications view query helpers', () => {
  it('defaults missing or unknown view values to grid', () => {
    expect(getApplicationsView(null)).toBe('grid');
    expect(getApplicationsView('')).toBe('grid');
    expect(getApplicationsView('table')).toBe('grid');
  });

  it('accepts kanban as the alternate view', () => {
    expect(getApplicationsView('kanban')).toBe('kanban');
  });

  it('persists the selected view while preserving existing query params', () => {
    const params = new URLSearchParams('page=3&status=applied&sort=company_asc');
    const next = setApplicationsViewParam(params, 'kanban');

    expect(next.get('view')).toBe('kanban');
    expect(next.get('page')).toBe('3');
    expect(next.get('status')).toBe('applied');
    expect(next.get('sort')).toBe('company_asc');
  });

  it('stores grid explicitly instead of dropping the view query param', () => {
    const params = new URLSearchParams('view=kanban&page=2');
    const next = setApplicationsViewParam(params, 'grid');

    expect(next.get('view')).toBe('grid');
    expect(next.get('page')).toBe('2');
  });
});
