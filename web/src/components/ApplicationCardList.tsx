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

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function ApplicationCardList({ applications, onEdit, onDelete, deletingId }: Props) {
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No applications found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deletingId === app.id}
        />
      ))}
    </div>
  );
}

interface ApplicationCardProps {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function ApplicationCard({ app, onEdit, onDelete, isDeleting }: ApplicationCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const done = Object.values(app.checklist_state ?? {}).filter((v) => v === true).length;

  return (
    <div
      className="rounded-xl border bg-white p-4"
      style={{ borderColor: 'var(--line)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>
            {app.company}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>
            {app.title}{app.pay ? ` · ${app.pay}` : ''}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <ApplicationTypeBadge type={app.application_type} />
        {app.location && (
          <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--soft)', color: 'var(--ink-3)' }}>
            {app.location}
          </span>
        )}
        {app.applied_date && (
          <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--soft)', color: 'var(--ink-3)' }}>
            Applied {formatDate(app.applied_date)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/contacts?application_id=${app.id}`)}
          className="text-xs font-semibold hover:underline"
          style={{ color: done >= 15 ? '#15803D' : done >= 5 ? '#A36410' : done > 0 ? '#B5394A' : 'var(--ink-4)' }}
        >
          Checklist: {done}/{CHECKLIST_TOTAL}
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onEdit(app)} className="btn-outline text-xs px-3 py-1">Edit</button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setConfirmOpen(true)}
            className="btn-ghost text-red-600 hover:bg-red-50 px-2 py-1"
            aria-label="Delete"
          >
            {isDeleting ? <Spinner size="sm" color="red" /> : <TrashIcon />}
          </button>
        </div>
      </div>

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
    </div>
  );
}
