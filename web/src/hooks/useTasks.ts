import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '@/api/tasks.api';
import type { CreateTaskInput, TasksListParams, UpdateTaskInput } from '@/api/tasks.api';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params: TasksListParams) => ['tasks', 'list', params] as const,
};

export function useTasks(params: TasksListParams = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.getTasks(params),
    staleTime: 30_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      tasksApi.updateTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
