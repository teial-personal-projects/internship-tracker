import { apiClient } from './client';
import type {
  CreateTaskSchemaType,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  UpdateTaskSchemaType,
} from '@shared/schemas';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  application_id?: string | null;
  contact_id?: string | null;
  notes?: string | null;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface TasksListParams {
  category?: string;
  priority?: string;
  status?: string;
  application_id?: string;
  date_from?: string;
  date_to?: string;
}

export type CreateTaskInput = CreateTaskSchemaType;
export type UpdateTaskInput = Pick<UpdateTaskSchemaType, 'status' | 'priority' | 'due_date' | 'notes'>;

export async function getTasks(params: TasksListParams = {}): Promise<Task[]> {
  const { data } = await apiClient.get<{ data: Task[] }>('/tasks', { params });
  return data.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await apiClient.post<{ data: Task }>('/tasks', input);
  return data.data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await apiClient.patch<{ data: Task }>(`/tasks/${id}`, input);
  return data.data;
}
