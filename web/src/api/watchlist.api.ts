import { apiClient } from './client';
import type {
  CreateCompanyWatchlistEntrySchemaType,
  TaskPriority,
  UpdateCompanyWatchlistEntrySchemaType,
} from '@shared/schemas';

export interface WatchlistEntry {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string | null;
  website?: string | null;
  notes?: string | null;
  priority?: TaskPriority | null;
  target_apply_date?: string | null;
  added: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistListParams {
  search?: string;
  priority?: string;
  target_apply_date_from?: string;
  target_apply_date_to?: string;
}

export async function getWatchlist(params: WatchlistListParams = {}): Promise<WatchlistEntry[]> {
  const { data } = await apiClient.get<{ data: WatchlistEntry[] }>('/watchlist', { params });
  return data.data;
}

export async function createWatchlistEntry(
  input: CreateCompanyWatchlistEntrySchemaType,
): Promise<WatchlistEntry> {
  const { data } = await apiClient.post<{ data: WatchlistEntry }>('/watchlist', input);
  return data.data;
}

export async function updateWatchlistEntry(
  id: string,
  input: UpdateCompanyWatchlistEntrySchemaType,
): Promise<WatchlistEntry> {
  const { data } = await apiClient.patch<{ data: WatchlistEntry }>(`/watchlist/${id}`, input);
  return data.data;
}

export async function deleteWatchlistEntry(id: string): Promise<void> {
  await apiClient.delete(`/watchlist/${id}`);
}

export async function promoteWatchlistEntry(id: string): Promise<{ application_id: string }> {
  const { data } = await apiClient.post<{ data: { application_id: string } }>(`/watchlist/${id}/promote`);
  return data.data;
}
