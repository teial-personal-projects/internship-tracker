import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Application } from '@shared/schemas';
import { StatusBadge } from './StatusBadge';
import { TrashIcon } from './icons/TrashIcon';
import { Spinner } from './Spinner';
import { formatDate } from '@/lib/dateUtils';
import { STATUS_COLORS } from '@/theme';

export function getAppliedDateLabel(appliedDate: string | null | undefined): string {
  return formatDate(appliedDate, 'Not applied');
}

export function getAddedDateLabel(addedDate: string | null | undefined): string {
  return formatDate(addedDate, 'Not set');
}

interface Props {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ApplicationRow({ app, onEdit, onDelete, isDeleting }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const statusColor = STATUS_COLORS[app.status]?.dot ?? 'var(--ink-4)';

  return (
    <>
      <tr className="border-b transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--line-soft)' }}>
        <td className="w-full py-2 pl-0 pr-3">
          <div className="grid min-h-12 grid-cols-[4px_minmax(0,1fr)] gap-3">
            <div className="rounded-r-full" style={{ background: statusColor }} aria-hidden="true" />
            <div className="min-w-0 py-0.5">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {app.company}
              </p>
              <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
                {app.title}
              </p>
            </div>
          </div>
        </td>

        <td className="px-2 py-2 whitespace-nowrap">
          <StatusBadge status={app.status} />
        </td>

        <td className="px-2 py-2 whitespace-nowrap text-sm" style={{ color: app.applied_date ? 'var(--ink-2)' : 'var(--ink-4)' }}>
          {getAppliedDateLabel(app.applied_date)}
        </td>

        <td className="px-2 py-2 whitespace-nowrap text-sm" style={{ color: 'var(--ink-2)' }}>
          {getAddedDateLabel(app.added)}
        </td>

        <td className="max-w-48 px-2 py-2 text-sm" style={{ color: app.location ? 'var(--ink-2)' : 'var(--ink-4)' }}>
          <span className="block truncate">{app.location ?? 'No location'}</span>
        </td>

        <td className="sticky right-0 bg-white px-2 py-2" style={{ boxShadow: '-2px 0 6px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(app)}
              className="btn-outline text-xs px-2 py-1"
              style={{ color: 'var(--accent-dark)', borderColor: 'var(--accent-soft)' }}
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setConfirmOpen(true)}
              className="btn-ghost text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
              aria-label="Delete"
            >
              {isDeleting ? <Spinner size="sm" color="red" /> : <TrashIcon />}
            </button>
          </div>
        </td>
      </tr>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <AlertDialog.Content className="app-confirm-content">
            <AlertDialog.Title className="text-base font-bold mb-2" style={{ color: 'var(--ink)' }}>
              Delete Application
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>
              Delete <strong>{app.company}</strong> — {app.title}? This cannot be undone.
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
    </>
  );
}
