import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Application, ApplicationStatus } from '@shared/schemas';
import { GripVertical } from 'lucide-react';
import { ApplicationTypeBadge } from '@/components/ApplicationTypeBadge';
import { Spinner } from '@/components/Spinner';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { formatDate } from '@/lib/dateUtils';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

export const APPLICATION_KANBAN_STATUSES = [
  'not_started',
  'in_progress',
  'applied',
  'screening',
  'interviewing',
  'technical',
  'on_site',
  'final_round',
  'offered',
  'rejected',
  'withdrawn',
  'archive',
] satisfies ApplicationStatus[];

export type ApplicationsByStatus = Record<ApplicationStatus, Application[]>;

export function groupApplicationsByStatus(applications: Application[]): ApplicationsByStatus {
  const grouped = APPLICATION_KANBAN_STATUSES.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as ApplicationsByStatus);

  for (const app of applications) {
    grouped[app.status].push(app);
  }

  return grouped;
}

export function getKanbanStatusMove(
  app: Application | undefined,
  targetStatus: string | undefined,
): { app: Application; status: ApplicationStatus } | null {
  if (!app || !targetStatus || !isApplicationKanbanStatus(targetStatus) || app.status === targetStatus) {
    return null;
  }

  return { app, status: targetStatus };
}

function isApplicationKanbanStatus(status: string): status is ApplicationStatus {
  return APPLICATION_KANBAN_STATUSES.includes(status as ApplicationStatus);
}

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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
        ) : applications.map((app) => (
          <KanbanCard
            key={app.id}
            app={app}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={deletingId === app.id}
          />
        ))}
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const colors = STATUS_COLORS[app.status] ?? { dot: 'var(--ink-4)' };
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: app.id,
    data: { status: app.status },
  });
  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      className="w-full min-w-0 overflow-hidden rounded-md border bg-white shadow-sm"
      style={{
        ...dragStyle,
        borderColor: 'var(--line)',
        opacity: isDragging ? 0.7 : 1,
        position: 'relative',
        zIndex: isDragging ? 20 : 'auto',
      }}
    >
      <div className="h-1" style={{ background: colors.dot }} aria-hidden="true" />
      <div className="p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs hover:bg-gray-50 focus:outline-none focus:ring-2"
            style={{ color: 'var(--ink-4)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            aria-label={`Move ${app.company}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {app.company}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5" style={{ color: 'var(--ink-3)' }}>
              {app.title}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <ApplicationTypeBadge type={app.application_type} />
          <span className="rounded px-2 py-0.5 text-[11px]" style={{ background: 'var(--soft)', color: 'var(--ink-3)' }}>
            {app.location ?? 'No location'}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-4)' }}>Applied</dt>
            <dd className="mt-0.5 truncate" style={{ color: app.applied_date ? 'var(--ink-2)' : 'var(--ink-4)' }}>
              {formatDate(app.applied_date, 'Not applied')}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-4)' }}>Added</dt>
            <dd className="mt-0.5 truncate" style={{ color: 'var(--ink-2)' }}>
              {formatDate(app.added, 'Not set')}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-end gap-1">
          <button type="button" onClick={() => onEdit(app)} className="btn-outline px-2 py-1 text-xs">
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setConfirmOpen(true)}
            className="btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            aria-label="Delete"
          >
            {isDeleting ? <Spinner size="sm" color="red" /> : <TrashIcon />}
          </button>
        </div>
      </div>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <AlertDialog.Content className="app-confirm-content">
            <AlertDialog.Title className="mb-2 text-base font-bold" style={{ color: 'var(--ink)' }}>
              Delete Application
            </AlertDialog.Title>
            <AlertDialog.Description className="mb-5 text-sm" style={{ color: 'var(--ink-2)' }}>
              Delete <strong>{app.company}</strong> - {app.title}? This cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button type="button" className="btn-ghost text-sm text-gray-600">Cancel</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => { setConfirmOpen(false); onDelete(app.id); }}
                  className="btn-danger text-sm"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </article>
  );
}
