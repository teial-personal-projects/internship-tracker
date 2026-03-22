import { useQuery } from '@tanstack/react-query';
import * as jobBoardsApi from '@/api/jobBoards.api';

export function useJobBoards() {
  return useQuery({
    queryKey: ['job-boards'],
    queryFn: jobBoardsApi.getJobBoards,
    staleTime: 5 * 60_000, // boards rarely change
  });
}
