import { apiClient } from './client';
import type { Job, CreateJobInput, UpdateJobInput } from '@shared/types';

export async function getJobs(): Promise<Job[]> {
  const { data } = await apiClient.get<{ data: Job[] }>('/jobs');
  return data.data;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const { data } = await apiClient.post<{ data: Job }>('/jobs', input);
  return data.data;
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const { data } = await apiClient.patch<{ data: Job }>(`/jobs/${id}`, input);
  return data.data;
}

export async function deleteJob(id: string): Promise<void> {
  await apiClient.delete(`/jobs/${id}`);
}
