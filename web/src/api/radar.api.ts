import { apiClient } from './client';
import type { DiscoveredPosting, PostingStatus } from '@shared/schemas';

export interface RadarPostingsParams {
  status?: PostingStatus;
  watchlist_id?: string;
  search?: string;
}

export async function getRadarPostings(params: RadarPostingsParams = {}): Promise<DiscoveredPosting[]> {
  const { data } = await apiClient.get<{ data: DiscoveredPosting[] }>('/radar/postings', { params });
  return data.data;
}

export async function updateRadarPostingStatus(
  id: string,
  status: Extract<PostingStatus, 'seen' | 'dismissed'>,
): Promise<DiscoveredPosting> {
  const { data } = await apiClient.patch<{ data: DiscoveredPosting }>(`/radar/postings/${id}`, { status });
  return data.data;
}

export async function promoteRadarPosting(id: string): Promise<{ application_id: string }> {
  const { data } = await apiClient.post<{ data: { application_id: string } }>(`/radar/postings/${id}/promote`);
  return data.data;
}
