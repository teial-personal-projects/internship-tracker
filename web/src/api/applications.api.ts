import { apiClient } from './client';
import type { Application } from '@shared/schemas';
import type { CreateApplicationSchemaType, UpdateApplicationSchemaType } from '@shared/schemas';

export interface ApplicationsListParams {
  status?: string;
  application_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ApplicationsListResponse {
  data: Application[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApplicationStats {
  status_counts: Record<string, number>;
}

export async function getApplications(params: ApplicationsListParams = {}): Promise<ApplicationsListResponse> {
  const { data } = await apiClient.get<ApplicationsListResponse>('/applications', { params });
  return data;
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  const { data } = await apiClient.get<ApplicationStats>('/applications/stats');
  return data;
}

export async function createApplication(input: CreateApplicationSchemaType): Promise<Application> {
  const { data } = await apiClient.post<{ data: Application }>('/applications', input);
  return data.data;
}

export async function updateApplication(id: string, input: UpdateApplicationSchemaType): Promise<Application> {
  const { data } = await apiClient.patch<{ data: Application }>(`/applications/${id}`, input);
  return data.data;
}

export async function deleteApplication(id: string): Promise<{ cascaded: boolean }> {
  const { data } = await apiClient.delete<{ data: null; cascaded: boolean }>(`/applications/${id}`);
  return { cascaded: data.cascaded };
}
