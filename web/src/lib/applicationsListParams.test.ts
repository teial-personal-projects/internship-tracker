import { describe, expect, it } from 'vitest';
import {
  buildApplicationsListParams,
  hasApplicationListFilters,
  toggleStatusFilter,
} from './applicationsListParams';

describe('buildApplicationsListParams', () => {
  it('keeps search, date range, status, page, and limit in the applications query params', () => {
    expect(buildApplicationsListParams({
      statusFilter: 'applied',
      search: '  acme  ',
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
      sort: 'company_asc',
      page: 3,
      limit: 25,
    })).toEqual({
      status: 'applied',
      search: 'acme',
      date_from: '2026-01-01',
      date_to: '2026-06-30',
      sort: 'company_asc',
      page: 3,
      limit: 25,
    });
  });

  it('does not include an implicit year parameter', () => {
    expect(buildApplicationsListParams({
      statusFilter: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      sort: 'added_desc',
      page: 1,
      limit: 25,
    })).toEqual({ sort: 'added_desc', page: 1, limit: 25 });
  });
});

describe('toggleStatusFilter', () => {
  it('sets a rail status when it is inactive and clears it when clicked again', () => {
    expect(toggleStatusFilter('', 'screening')).toBe('screening');
    expect(toggleStatusFilter('screening', 'screening')).toBe('');
  });
});

describe('hasApplicationListFilters', () => {
  it('detects search, date, and status filters without counting whitespace search', () => {
    const emptyFilters = {
      statusFilter: '',
      search: '   ',
      dateFrom: '',
      dateTo: '',
    };

    expect(hasApplicationListFilters(emptyFilters)).toBe(false);
    expect(hasApplicationListFilters({ ...emptyFilters, statusFilter: 'applied' })).toBe(true);
    expect(hasApplicationListFilters({ ...emptyFilters, search: 'acme' })).toBe(true);
    expect(hasApplicationListFilters({ ...emptyFilters, dateFrom: '2026-01-01' })).toBe(true);
    expect(hasApplicationListFilters({ ...emptyFilters, dateTo: '2026-06-30' })).toBe(true);
  });
});
