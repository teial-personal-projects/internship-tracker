import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Application, ApplicationStatus } from '@shared/schemas';
import { ApplicationCompactCard } from '@/components/applications/ApplicationCompactCard';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

export const APPLICATION_KANBAN_STATUSES = [
  'not_started',
  'in_progress',
  'applied',
  'interviewing',
  'offered',
  'rejected',
] satisfies ApplicationStatus[];

export type ApplicationKanbanStatus = (typeof APPLICATION_KANBAN_STATUSES)[number];
export type ApplicationsByStatus = Record<ApplicationKanbanStatus, Application[]>;
const KANBAN_STATUS_BY_APPLICATION_STATUS: Record<ApplicationStatus, ApplicationKanbanStatus> = {
  not_started: 'not_started',
  in_progress: 'in_progress',
  applied: 'applied',
  interviewing: 'interviewing',
  offered: 'offered',
  rejected: 'rejected',
  archive: 'rejected',
};

export function groupApplicationsByStatus(applications: Application[]): ApplicationsByStatus {
  const grouped = APPLICATION_KANBAN_STATUSES.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as ApplicationsByStatus);

  for (const app of applications) {
    grouped[KANBAN_STATUS_BY_APPLICATION_STATUS[app.status]].push(app);
  }

  return grouped;
}

export function getKanbanStatusMove(
  app: Application | undefined,
  targetStatus: string | undefined,
): { app: Application; status: ApplicationStatus } | null {
  if (
    !app
    || !targetStatus
    || !isApplicationKanbanStatus(targetStatus)
    || KANBAN_STATUS_BY_APPLICATION_STATUS[app.status] === targetStatus
  ) {
    return null;
  }

  return { app, status: targetStatus };
}

function isApplicationKanbanStatus(status: string): status is ApplicationKanbanStatus {
  return APPLICATION_KANBAN_STATUSES.includes(status as ApplicationKanbanStatus);
}

const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (app: Application, status: ApplicationStatus) => void;
  deletingId: string | null;
}

export function ApplicationsKanbanBoard({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
  deletingId,
}: Props) {
  const grouped = groupApplicationsByStatus(applications);
  const appById = new Map(applications.map((app) => [app.id, app]));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const app = appById.get(String(event.active.id));
    const move = getKanbanStatusMove(app, event.over?.id ? String(event.over.id) : undefined);
    if (!move) return;

    onStatusChange(move.app, move.status);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={kanbanCollisionDetection} onDragEnd={handleDragEnd}>
      <div className="w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex min-w-max gap-3">
          {APPLICATION_KANBAN_STATUSES.map((status) => {
            const laneApplications = grouped[status];
            return (
              <KanbanLane
                key={status}
                status={status}
                applications={laneApplications}
                onEdit={onEdit}
                onDelete={onDelete}
                deletingId={deletingId}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function KanbanLane({
  status,
  applications,
  onEdit,
  onDelete,
  deletingId,
}: {
  status: ApplicationStatus;
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const colors = STATUS_COLORS[status] ?? { bg: 'var(--soft)', color: 'var(--ink-3)', dot: 'var(--ink-4)' };
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABELS[status] ?? status}
      className="flex max-h-[68vh] w-[min(18rem,calc(100vw-2rem))] shrink-0 flex-col rounded-lg border sm:w-72"
      style={{
        background: isOver ? 'var(--accent-tint)' : 'var(--softer)',
        borderColor: isOver ? 'var(--accent)' : 'var(--line)',
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors.dot }} aria-hidden="true" />
          <h2 className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {STATUS_LABELS[status] ?? status}
          </h2>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: colors.bg, color: colors.color }}>
          {applications.length}
        </span>
      </div>

      <div className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {applications.length === 0 ? (
          <div
            className="flex min-h-28 items-center justify-center rounded-md border border-dashed px-3 text-center text-xs"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-4)' }}
          >
            No applications
          </div>
        ) : (
          <>
            {applications.map((app) => (
              <KanbanCard
                key={app.id}
                app={app}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={deletingId === app.id}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function KanbanCard({
  app,
  onEdit,
  onDelete,
  isDeleting,
}: {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: app.id,
    data: { status: app.status },
  });
  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className="cursor-grab touch-none active:cursor-grabbing"
      style={{ ...dragStyle, opacity: isDragging ? 0.7 : 1, zIndex: isDragging ? 20 : undefined, position: 'relative' }}
      {...attributes}
      {...listeners}
    >
      <ApplicationCompactCard app={app} onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
    </div>
  );
}
