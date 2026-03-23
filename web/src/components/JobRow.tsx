import { useState, useRef } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { Job } from '@shared/types';
import { StatusBadge } from './StatusBadge';
import { TrashIcon } from './icons/TrashIcon';
import { safeUrl } from '@/lib/jobUtils';
import { formatDate, isDeadlineSoon, isStaleJob } from '@/lib/dateUtils';

export type ColKey =
  | 'company' | 'title' | 'industry' | 'location'
  | 'added' | 'applied' | 'deadline' | 'status'
  | 'conference'
  | 'job_link' | 'app_link' | 'cover_letter' | 'pay' | 'notes' | 'actions';

interface Props {
  job: Job;
  colOrder: ColKey[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  isApplying: boolean;
  isDeleting: boolean;
}

function getRowBg(job: Job): React.CSSProperties | undefined {
  if (['applied', 'archive'].includes(job.status)) return undefined;
  if (isDeadlineSoon(job.deadline)) return { background: '#fef2f2' };
  if (isStaleJob(job.added, job.status)) return { background: '#fff7ed' };
  return undefined;
}

export function JobRow({
  job,
  colOrder,
  onEdit,
  onDelete,
  onMarkApplied,
  isApplying,
  isDeleting,
}: Props) {
  const bgStyle = getRowBg(job);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  function renderCell(key: ColKey) {
    switch (key) {
      case 'company':
        return (
          <td key={key} className="text-sm font-medium px-2 py-2" style={bgStyle}>
            <div className="font-medium">{job.company}</div>
            <div className="text-xs text-gray-500">{job.title}{job.pay ? ` - ${job.pay}` : ''}</div>
            {job.min_year && (
              <div className="text-xs text-gray-400 capitalize">MinYear: {job.min_year}</div>
            )}
          </td>
        );
      case 'title':
        return null;
      case 'industry':
        return null;
      case 'location':
        return (
          <td key={key} className="text-sm text-gray-600 whitespace-nowrap px-2 py-2" style={bgStyle}>
            <div>{job.location ?? '—'}</div>
            {job.industry && <div className="text-xs text-gray-400">{job.industry}</div>}
          </td>
        );
      case 'added':
        return <td key={key} className="text-sm whitespace-nowrap px-2 py-2" style={bgStyle}>{formatDate(job.added)}</td>;
      case 'applied':
        return <td key={key} className="text-sm whitespace-nowrap px-2 py-2" style={bgStyle}>{formatDate(job.applied_date)}</td>;
      case 'deadline':
        return (
          <td key={key} className={`text-sm whitespace-nowrap px-2 py-2 ${job.deadline ? '' : 'text-gray-400'}`} style={bgStyle}>
            {formatDate(job.deadline)}
          </td>
        );
      case 'status':
        return (
          <td key={key} className="px-2 py-2" style={bgStyle}>
            <StatusBadge job={job} />
          </td>
        );
      case 'conference':
        return <td key={key} className="text-sm text-gray-600 px-2 py-2" style={bgStyle}>{job.conference ?? '—'}</td>;
      case 'job_link': {
        const jobUrl = safeUrl(job.job_link);
        const appUrl = safeUrl(job.app_link);
        return (
          <td key={key} className="text-sm px-2 py-2" style={bgStyle}>
            <div className="flex flex-col gap-0.5">
              {jobUrl ? <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">Job</a> : '—'}
              {appUrl && <a href={appUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">Apply</a>}
            </div>
          </td>
        );
      }
      case 'app_link':
        return null;
      case 'cover_letter': {
        const url = safeUrl(job.cover_letter);
        return (
          <td key={key} className="text-sm px-2 py-2" style={bgStyle}>
            {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">Cover Letter</a> : '—'}
          </td>
        );
      }
      case 'pay':
        return null;
      case 'notes':
        return (
          <td key={key} className="text-sm max-w-37.5 px-2 py-2" style={bgStyle}>
            {job.notes ? (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap cursor-default">
                      {job.notes}
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="max-w-xs bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-50"
                      sideOffset={4}
                    >
                      {job.notes}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            ) : '—'}
          </td>
        );
      case 'actions':
        return (
          <td
            key={key}
            className="px-2 py-2 z-1"
            style={{ position: 'sticky', right: 0, boxShadow: '-2px 0 6px rgba(0,0,0,0.06)', background: bgStyle?.background ?? 'white' }}
          >
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onEdit(job)}
                className="btn-outline text-xs px-2 py-1 text-brand-700 border-brand-400 hover:bg-brand-50"
              >
                Edit
              </button>
              {!['applied', 'archive'].includes(job.status) && (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() => onMarkApplied(job.id)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-brand-400 text-brand-700 bg-white hover:bg-brand-50 transition-colors disabled:opacity-50"
                >
                  {isApplying ? (
                    <span className="w-3 h-3 border border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : 'Mark Applied'}
                </button>
              )}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirmOpen(true)}
                className="btn-ghost text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                aria-label="Delete job"
              >
                {isDeleting ? (
                  <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : <TrashIcon />}
              </button>
            </div>
          </td>
        );
    }
  }

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors"
        style={bgStyle}
      >
        {colOrder.map(key => renderCell(key))}
      </tr>

      <AlertDialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm p-6">
            <AlertDialog.Title className="text-base font-bold text-gray-900 mb-2">
              Delete Job
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-600 mb-5">
              Delete <strong>{job.company}</strong>{job.title !== 'N/A' ? ` — ${job.title}` : ''}? This cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button ref={cancelRef} type="button" className="btn-ghost text-sm text-gray-600">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => { setIsConfirmOpen(false); onDelete(job.id); }}
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
    </>
  );
}
