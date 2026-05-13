import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationsApi from '@/api/applications.api';
import type { ApplicationsListParams } from '@/api/applications.api';
import type {
  CreateApplicationEventSchemaType,
  CreateApplicationSchemaType,
  UpdateApplicationSchemaType,
} from '@shared/schemas';

export const applicationKeys = {
  all: ['applications'] as const,
  list: (params: ApplicationsListParams) => ['applications', 'list', params] as const,
  detail: (id: string) => ['applications', 'detail', id] as const,
  stats: () => ['applications', 'stats'] as const,
  events: (id: string) => ['applications', 'events', id] as const,
  contacts: (id: string) => ['applications', 'contacts', id] as const,
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

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: id ? applicationKeys.detail(id) : ['applications', 'detail', 'none'],
    queryFn: () => applicationsApi.getApplication(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: applicationKeys.stats(),
    queryFn: () => applicationsApi.getApplicationStats(),
    staleTime: 60_000,
  });
}

export function useApplicationEvents(applicationId: string | null) {
  return useQuery({
    queryKey: applicationId ? applicationKeys.events(applicationId) : ['applications', 'events', 'none'],
    queryFn: () => applicationsApi.getApplicationEvents(applicationId as string),
    enabled: Boolean(applicationId),
    staleTime: 30_000,
  });
}

export function useApplicationContacts(applicationId: string | null) {
  return useQuery({
    queryKey: applicationId ? applicationKeys.contacts(applicationId) : ['applications', 'contacts', 'none'],
    queryFn: () => applicationsApi.getApplicationContacts(applicationId as string),
    enabled: Boolean(applicationId),
    staleTime: 30_000,
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

export function useCreateApplicationEvent(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationEventSchemaType) =>
      applicationsApi.createApplicationEvent(applicationId, input),
    onSuccess: (event) => {
      qc.setQueryData<applicationsApi.ApplicationEvent[]>(
        applicationKeys.events(applicationId),
        (current) => [event, ...(current ?? [])],
      );
    },
  });
}
