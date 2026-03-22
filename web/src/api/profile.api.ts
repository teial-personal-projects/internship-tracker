import { apiClient } from './client';
import type { UserProfile, UpdateProfileInput } from '@shared/types';

export async function getProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<{ data: UserProfile }>('/profile');
  return data.data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const { data } = await apiClient.put<{ data: UserProfile }>('/profile', input);
  return data.data;
}
