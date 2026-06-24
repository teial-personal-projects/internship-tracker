import { apiClient } from './client';
import type { DiscoveredPosting, PostingStatus, PostingValidityStatus, SourceTier } from '@shared/schemas';
import type { WatchlistEntry } from './watchlist.api';

export interface RadarPostingsParams {
  status?: PostingStatus;
  watchlist_id?: string;
  search?: string;
  source_tier?: SourceTier;
  validity_status?: PostingValidityStatus;
  sort?: 'quality' | 'first_seen' | 'posted_at';
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

export interface SaveRadarCompanyResult {
  watchlist_entry: WatchlistEntry;
  created: boolean;
}

export async function saveRadarPostingCompany(id: string): Promise<SaveRadarCompanyResult> {
  const { data } = await apiClient.post<{ data: SaveRadarCompanyResult }>(`/radar/postings/${id}/save-company`);
  return data.data;
}
