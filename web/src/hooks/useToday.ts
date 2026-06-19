import { useQuery } from '@tanstack/react-query';
import * as todayApi from '@/api/today.api';

export const todayKeys = {
  all: ['today'] as const,
};

export function useToday() {
  return useQuery({
    queryKey: todayKeys.all,
    queryFn: todayApi.getToday,
    staleTime: 30_000,
  });
}
