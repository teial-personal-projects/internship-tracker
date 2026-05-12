import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Application } from '@shared/schemas';
import { StatusBadge } from './StatusBadge';
import { ApplicationTypeBadge } from './ApplicationTypeBadge';
import { TrashIcon } from './icons/TrashIcon';
import { Spinner } from './Spinner';
import { formatDate } from '@/lib/dateUtils';

const CHECKLIST_TOTAL = 18;

function checklistColor(done: number): string {
  if (done === 0) return 'var(--ink-4)';
  if (done >= 15) return '#15803D';
  if (done >= 5)  return '#A36410';
  return '#B5394A';
}

interface Props {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ApplicationRow({ app, onEdit, onDelete, isDeleting }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const doneTasks = Object.values(app.checklist_state ?? {}).filter((v) => v === true).length;
  const progressColor = checklistColor(doneTasks);

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{app.company}</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
            {app.title}{app.pay ? ` · ${app.pay}` : ''}
          </div>
        </td>

        <td className="px-2 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--ink-3)' }}>
          {app.location ?? '—'}
        </td>

        <td className="px-2 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--ink-3)' }}>
          {formatDate(app.applied_date)}
        </td>

        <td className="px-2 py-2.5">
          <StatusBadge status={app.status} />
        </td>

        <td className="px-2 py-2.5">
          <ApplicationTypeBadge type={app.application_type} />
        </td>

        <td className="px-2 py-2.5">
          <button
            type="button"
            onClick={() => navigate(`/contacts?application_id=${app.id}`)}
            className="text-sm font-semibold tabular-nums hover:underline"
            style={{ color: progressColor }}
          >
            {doneTasks}/{CHECKLIST_TOTAL}
          </button>
        </td>

        <td className="px-2 py-2.5 sticky right-0 bg-white" style={{ boxShadow: '-2px 0 6px rgba(0,0,0,0.05)' }}>
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
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm mx-4 p-6">
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
