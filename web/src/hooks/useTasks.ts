import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '@/api/tasks.api';
import { todayKeys } from '@/hooks/useToday';
import type { CreateTaskInput, TasksListParams, UpdateTaskInput } from '@/api/tasks.api';
import type { TodayPayload } from '@shared/schemas';

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
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      if (task.status === 'complete') {
        qc.setQueryData<TodayPayload>(todayKeys.all, (current) => {
          if (!current) return current;

          return {
            ...current,
            stats: {
              ...current.stats,
              open_tasks: Math.max(0, current.stats.open_tasks - 1),
            },
            action_items: current.action_items.filter((item) => item.id !== task.id),
          };
        });
      }
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
}
