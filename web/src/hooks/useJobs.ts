import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as jobsApi from '@/api/jobs.api';
import type { UpdateJobInput, CreateJobInput, JobStatus } from '@shared/types';
import { STATUS_CYCLE } from '@shared/types';

export const jobKeys = {
  all: ['jobs'] as const,
  list: (year: number) => ['jobs', 'list', year] as const,
};

export function useJobs(year: number) {
  return useQuery({
    queryKey: jobKeys.list(year),
    queryFn: () => jobsApi.getJobs(year),
    staleTime: 30_000,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJobInput) => jobsApi.createJob(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobInput }) =>
      jobsApi.updateJob(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useCycleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: JobStatus }) => {
      const idx = STATUS_CYCLE.indexOf(currentStatus);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return jobsApi.updateJob(id, { status: next });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useToggleReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, review }: { id: string; review: boolean }) =>
      jobsApi.updateJob(id, { review }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useMarkApplied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.updateJob(id, { status: 'applied' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
