import { apiClient } from './client';
import type { TodayPayload } from '@shared/schemas';

export async function getToday(): Promise<TodayPayload> {
  const { data } = await apiClient.get<{ data: TodayPayload }>('/today');
  return data.data;
}
