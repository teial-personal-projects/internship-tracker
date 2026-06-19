import { describe, expect, it } from 'vitest';
import { buildApplicationsListParams, toggleStatusFilter } from './applicationsListParams';

describe('buildApplicationsListParams', () => {
  it('keeps search, date range, type, status, page, and limit in the applications query params', () => {
    expect(buildApplicationsListParams({
      statusFilter: 'applied',
      typeFilter: 'referral',
      search: '  acme  ',
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
      page: 3,
      limit: 25,
    })).toEqual({
      status: 'applied',
      application_type: 'referral',
      search: 'acme',
      date_from: '2026-01-01',
      date_to: '2026-06-30',
      page: 3,
      limit: 25,
    });
  });

  it('does not include an implicit year parameter', () => {
    expect(buildApplicationsListParams({
      statusFilter: '',
      typeFilter: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 25,
    })).toEqual({ page: 1, limit: 25 });
  });
});

describe('toggleStatusFilter', () => {
  it('sets a rail status when it is inactive and clears it when clicked again', () => {
    expect(toggleStatusFilter('', 'screening')).toBe('screening');
    expect(toggleStatusFilter('screening', 'screening')).toBe('');
  });
});
