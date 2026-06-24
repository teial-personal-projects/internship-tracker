import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as radarApi from '@/api/radar.api';
import type { RadarPostingsParams } from '@/api/radar.api';
import type { PostingStatus } from '@shared/schemas';

export const radarKeys = {
  all: ['radar'] as const,
  postings: (params: RadarPostingsParams) => ['radar', 'postings', params] as const,
  criteria: () => ['radar', 'criteria'] as const,
  searchSources: () => ['radar', 'search-sources'] as const,
};

export function useRadarPostings(params: RadarPostingsParams = {}) {
  return useQuery({
    queryKey: radarKeys.postings(params),
    queryFn: () => radarApi.getRadarPostings(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useRadarCriteria() {
  return useQuery({
    queryKey: radarKeys.criteria(),
    queryFn: radarApi.getRadarCriteria,
    staleTime: 60_000,
  });
}

export function useRadarSearchSources() {
  return useQuery({
    queryKey: radarKeys.searchSources(),
    queryFn: radarApi.getRadarSearchSources,
    staleTime: 60_000,
  });
}

export function useUpdateRadarCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: radarApi.updateRadarCriteria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarKeys.criteria() });
    },
  });
}

export function useSearchTrustedSources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: radarApi.searchTrustedSources,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarKeys.all });
    },
  });
}

export function useUpdateRadarPostingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Extract<PostingStatus, 'seen' | 'dismissed'> }) =>
      radarApi.updateRadarPostingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarKeys.all });
    },
  });
}
