import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Application } from '@shared/schemas';
import { Spinner } from '@/components/Spinner';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/dateUtils';
import { STATUS_COLORS } from '@/theme';

interface Props {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function ApplicationCompactCard({ app, onEdit, onDelete, isDeleting = false }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dot = (STATUS_COLORS[app.status] ?? { dot: 'var(--ink-4)' }).dot;

  return (
    <article
      className="w-full min-w-0 overflow-hidden rounded-md border bg-white shadow-sm"
      style={{ borderColor: 'var(--line)' }}
    >
      <div className="h-1" style={{ background: dot }} aria-hidden="true" />

      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {app.company}
          </h3>
          <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
            {app.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(app); }}
            className="btn-outline px-2 py-0.5 text-xs"
          >
            Edit
          </button>
          {onDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
              className="btn-ghost px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
              aria-label="Delete"
            >
              {isDeleting ? <Spinner size="sm" color="red" /> : <TrashIcon />}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
        <StatusBadge status={app.status} />
        <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
          {formatDate(app.applied_date, 'Not applied')}
        </span>
        <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
          Added {formatDate(app.added)}
        </span>
        {app.location && (
          <span className="min-w-0 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
            {app.location}
          </span>
        )}
      </div>

      {onDelete && (
        <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
            <AlertDialog.Content className="app-confirm-content">
              <AlertDialog.Title className="mb-2 text-base font-bold" style={{ color: 'var(--ink)' }}>
                Delete Application
              </AlertDialog.Title>
              <AlertDialog.Description className="mb-5 text-sm" style={{ color: 'var(--ink-2)' }}>
                Delete <strong>{app.company}</strong>? This cannot be undone.
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
      )}
    </article>
  );
}
