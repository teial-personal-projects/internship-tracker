import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as profileApi from '@/api/profile.api';
import type { UpdateProfileInput } from '@shared/types';

const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: profileApi.getProfile,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.updateProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
