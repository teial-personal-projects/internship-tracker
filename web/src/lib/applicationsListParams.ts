import type { ApplicationsListParams } from '@/api/applications.api';

interface BuildApplicationsListParamsInput {
  statusFilter: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  sort: NonNullable<ApplicationsListParams['sort']>;
  page: number;
  limit: number;
  showArchived: boolean;
}

export function buildApplicationsListParams({
  statusFilter,
  search,
  dateFrom,
  dateTo,
  sort,
  page,
  limit,
  showArchived,
}: BuildApplicationsListParamsInput): ApplicationsListParams {
  return {
    ...(statusFilter && { status: statusFilter }),
    ...(!showArchived && { exclude_archive: true }),
    ...(search.trim() && { search: search.trim() }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    sort,
    page,
    limit,
  };
}

export function toggleStatusFilter(currentStatus: string, nextStatus: string): string {
  return currentStatus === nextStatus ? '' : nextStatus;
}

export function hasApplicationListFilters({
  statusFilter,
  search,
  dateFrom,
  dateTo,
}: Pick<BuildApplicationsListParamsInput, 'statusFilter' | 'search' | 'dateFrom' | 'dateTo'>): boolean {
  return Boolean(statusFilter || search.trim() || dateFrom || dateTo);
}
