import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationsApi from '@/api/applications.api';
import type { ApplicationsListParams } from '@/api/applications.api';
import type { CreateApplicationSchemaType, UpdateApplicationSchemaType } from '@shared/schemas';

export const applicationKeys = {
  all: ['applications'] as const,
  list: (params: ApplicationsListParams) => ['applications', 'list', params] as const,
  stats: () => ['applications', 'stats'] as const,
};
// Query keys define the cache buckets for application data. Mutations invalidate
// applicationKeys.all so lists, stats, and other application queries refetch.

export function useApplications(params: ApplicationsListParams = {}) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationsApi.getApplications(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: applicationKeys.stats(),
    queryFn: () => applicationsApi.getApplicationStats(),
    staleTime: 60_000,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationSchemaType) => applicationsApi.createApplication(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationSchemaType }) =>
      applicationsApi.updateApplication(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}
