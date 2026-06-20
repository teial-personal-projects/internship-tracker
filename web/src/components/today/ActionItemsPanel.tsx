import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ApplicationTypeBadge } from '@/components/ApplicationTypeBadge';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/theme';
import { useUpdateTask } from '@/hooks/useTasks';
import type { TodayTask } from '@shared/schemas';

interface ActionItemsPanelProps {
  actionItems: TodayTask[];
  totalOpenTasks: number;
}

function formatDueLabel(dueDate: string | null): string {
  if (!dueDate) return 'No due date';

  const diff = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return format(parseISO(dueDate), 'MMM d');
}

function getTaskContext(task: TodayTask): string {
  const context = [
    task.application_company,
    task.application_title,
    task.contact_name,
  ].filter(Boolean);

  return context.length > 0 ? context.join(' · ') : 'Manual';
}

export function ActionItemsPanel({ actionItems, totalOpenTasks }: ActionItemsPanelProps) {
  const updateTask = useUpdateTask();

  async function completeTask(task: TodayTask) {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: 'complete' },
      });
    } catch {
      toast.error('Could not complete action item');
    }
  }

  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Action items
        </h3>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {totalOpenTasks}
        </span>
      </div>

      {actionItems.length === 0 ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          No open action items.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {actionItems.map((task) => {
            const priorityColor = PRIORITY_COLORS[task.priority];
            const isCompleting = updateTask.isPending && updateTask.variables?.id === task.id;

            return (
              <div key={task.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border"
                  style={{ borderColor: 'var(--line)', accentColor: 'var(--accent)' }}
                  checked={false}
                  disabled={isCompleting}
                  aria-label={`Complete ${task.title}`}
                  onChange={() => void completeTask(task)}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {task.title}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: priorityColor.bg, color: priorityColor.color }}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--ink-3)' }}>
                    <span className="min-w-0 truncate">{getTaskContext(task)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDueLabel(task.due_date)}</span>
                  </div>
                  {task.application_type && (
                    <div className="mt-2">
                      <ApplicationTypeBadge type={task.application_type} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
