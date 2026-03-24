import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Job } from '@shared/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DeleteJobDialog({ open, onOpenChange, job, isDeleting, onConfirm }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm mx-4 p-6">
          <AlertDialog.Title className="text-base font-bold text-gray-900 mb-2">
            Delete Job
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-gray-600 mb-5">
            Delete <strong>{job.company}</strong>{job.title !== 'N/A' ? ` — ${job.title}` : ''}? This cannot be undone.
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button type="button" className="btn-ghost text-sm text-gray-600">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => { onOpenChange(false); onConfirm(); }}
                className="btn-danger text-sm"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </span>
                ) : 'Delete'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
