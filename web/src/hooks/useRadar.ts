import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as radarApi from '@/api/radar.api';
import type { RadarPostingsParams } from '@/api/radar.api';
import type { PostingStatus } from '@shared/schemas';

export const radarKeys = {
  all: ['radar'] as const,
  postings: (params: RadarPostingsParams) => ['radar', 'postings', params] as const,
};

export function useRadarPostings(params: RadarPostingsParams = {}) {
  return useQuery({
    queryKey: radarKeys.postings(params),
    queryFn: () => radarApi.getRadarPostings(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
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

export function usePromoteRadarPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => radarApi.promoteRadarPosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarKeys.all });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
