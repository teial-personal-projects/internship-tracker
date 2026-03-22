import { apiClient } from './client';
import type { JobBoard } from '@shared/types';

export async function getJobBoards(): Promise<JobBoard[]> {
  const { data } = await apiClient.get<{ data: JobBoard[] }>('/job-boards');
  return data.data;
}
