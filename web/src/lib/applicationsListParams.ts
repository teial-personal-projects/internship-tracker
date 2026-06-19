import type { ApplicationsListParams } from '@/api/applications.api';

interface BuildApplicationsListParamsInput {
  statusFilter: string;
  typeFilter: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}

export function buildApplicationsListParams({
  statusFilter,
  typeFilter,
  search,
  dateFrom,
  dateTo,
  page,
  limit,
}: BuildApplicationsListParamsInput): ApplicationsListParams {
  return {
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { application_type: typeFilter }),
    ...(search.trim() && { search: search.trim() }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    page,
    limit,
  };
}

export function toggleStatusFilter(currentStatus: string, nextStatus: string): string {
  return currentStatus === nextStatus ? '' : nextStatus;
}
