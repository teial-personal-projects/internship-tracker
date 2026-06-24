import { apiClient } from './client';
import type {
  DiscoveredPosting,
  PostingStatus,
  PostingValidityStatus,
  RadarCriteria,
  SourceTier,
  UpdateRadarCriteriaSchemaType,
} from '@shared/schemas';
import type { WatchlistEntry } from './watchlist.api';

export interface RadarPostingsParams {
  status?: PostingStatus;
  watchlist_id?: string;
  search?: string;
  source_tier?: SourceTier;
  validity_status?: PostingValidityStatus;
  sort?: 'quality' | 'first_seen' | 'posted_at';
  include_closed?: boolean;
}

export async function getRadarPostings(params: RadarPostingsParams = {}): Promise<DiscoveredPosting[]> {
  const { data } = await apiClient.get<{ data: DiscoveredPosting[] }>('/radar/postings', { params });
  return data.data;
}

export async function getRadarCriteria(): Promise<RadarCriteria> {
  const { data } = await apiClient.get<{ data: RadarCriteria }>('/radar/criteria');
  return data.data;
}

export async function updateRadarCriteria(payload: UpdateRadarCriteriaSchemaType): Promise<RadarCriteria> {
  const { data } = await apiClient.put<{ data: RadarCriteria }>('/radar/criteria', payload);
  return data.data;
}

export interface TrustedSourceSearchResult {
  sources_searched: number;
  fetched: number;
  matched: number;
  inserted: number;
  criteria: RadarCriteria;
  message: string;
}

export async function searchTrustedSources(): Promise<TrustedSourceSearchResult> {
  const { data } = await apiClient.post<{ data: TrustedSourceSearchResult }>('/radar/search');
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
