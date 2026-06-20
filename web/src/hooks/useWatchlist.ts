import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as watchlistApi from '@/api/watchlist.api';
import type { WatchlistListParams } from '@/api/watchlist.api';
import type {
  CreateCompanyWatchlistEntrySchemaType,
  UpdateCompanyWatchlistEntrySchemaType,
} from '@shared/schemas';

export const watchlistKeys = {
  all: ['watchlist'] as const,
  list: (params: WatchlistListParams) => ['watchlist', 'list', params] as const,
};

export function useWatchlist(params: WatchlistListParams = {}) {
  return useQuery({
    queryKey: watchlistKeys.list(params),
    queryFn: () => watchlistApi.getWatchlist(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useCreateWatchlistEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyWatchlistEntrySchemaType) =>
      watchlistApi.createWatchlistEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

export function useUpdateWatchlistEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyWatchlistEntrySchemaType }) =>
      watchlistApi.updateWatchlistEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

export function useDeleteWatchlistEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistApi.deleteWatchlistEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

export function usePromoteWatchlistEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistApi.promoteWatchlistEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useRefreshWatchlistRadar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistApi.refreshWatchlistRadar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ['radar'] });
    },
  });
}
