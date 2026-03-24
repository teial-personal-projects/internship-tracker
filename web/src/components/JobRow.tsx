import { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { Job } from '@shared/types';
import { StatusBadge } from './StatusBadge';
import { TrashIcon } from './icons/TrashIcon';
import { DeleteJobDialog } from './DeleteJobDialog';
import { Spinner } from './Spinner';
import { safeUrl, getJobUrgency } from '@/lib/jobUtils';
import { formatDate, isNewJob } from '@/lib/dateUtils';

export type ColKey =
  | 'company' | 'title' | 'industry' | 'location'
  | 'added' | 'applied' | 'deadline' | 'status'
  | 'conference'
  | 'job_link' | 'app_link' | 'cover_letter' | 'pay' | 'notes'
  | 'review' | 'actions';

interface Props {
  job: Job;
  colOrder: ColKey[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  isApplying: boolean;
  isDeleting: boolean;
}

const URGENCY_BG: Record<string, string> = {
  urgent: '#fef2f2',
  stale:  '#fff7ed',
};

function getRowBg(job: Job): React.CSSProperties | undefined {
  const bg = URGENCY_BG[getJobUrgency(job)];
  return bg ? { background: bg } : undefined;
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

  function renderCell(key: ColKey) {
    switch (key) {
      case 'company':
        return (
          <td key={key} className="text-sm font-medium px-2 py-2" style={bgStyle}>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{job.company}</span>
              {isNewJob(job.added) && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold shrink-0">New</span>
              )}
              {job.conference && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold shrink-0">conf: {job.conference}</span>
              )}
            </div>
            <div className="text-xs text-gray-500">{job.title}{job.pay ? ` | ${job.pay}` : ''}</div>
            {job.min_year && (
              <div className="text-xs text-gray-400 capitalize">MinClass: {job.min_year}</div>
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
        return null;
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
            <div className="flex items-center gap-2">
              {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">Cover</a> : <span className="text-xs text-gray-400">—</span>}
              {job.review && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold shrink-0">Review</span>}
            </div>
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
      case 'review':
        return null;
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
                  {isApplying ? <Spinner size="sm" /> : 'Mark Applied'}
                </button>
              )}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirmOpen(true)}
                className="btn-ghost text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                aria-label="Delete job"
              >
                {isDeleting ? <Spinner size="sm" color="red" /> : <TrashIcon />}
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

      <DeleteJobDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        job={job}
        isDeleting={isDeleting}
        onConfirm={() => onDelete(job.id)}
      />
    </>
  );
}
