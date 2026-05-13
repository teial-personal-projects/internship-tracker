import { apiClient } from './client';
import type { Application } from '@shared/schemas';
import type {
  ApplicationEventType,
  CreateApplicationEventSchemaType,
  CreateApplicationSchemaType,
  UpdateApplicationSchemaType,
} from '@shared/schemas';

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
  unset_type_count: number;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  user_id: string;
  event_type: ApplicationEventType;
  body?: string | null;
  contact_id?: string | null;
  occurred_at: string;
  created_at: string;
  contacts?: {
    first_name: string;
    last_name: string;
  } | null;
}

export async function getApplications(params: ApplicationsListParams = {}): Promise<ApplicationsListResponse> {
  const { data } = await apiClient.get<ApplicationsListResponse>('/applications', { params });
  return data;
}

export async function getApplication(id: string): Promise<Application> {
  const { data } = await apiClient.get<{ data: Application }>(`/applications/${id}`);
  return data.data;
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

export async function getApplicationEvents(applicationId: string): Promise<ApplicationEvent[]> {
  const { data } = await apiClient.get<{ data: ApplicationEvent[] }>(`/applications/${applicationId}/events`);
  return data.data;
}

export async function createApplicationEvent(
  applicationId: string,
  input: CreateApplicationEventSchemaType,
): Promise<ApplicationEvent> {
  const { data } = await apiClient.post<{ data: ApplicationEvent }>(`/applications/${applicationId}/events`, input);
  return data.data;
}
