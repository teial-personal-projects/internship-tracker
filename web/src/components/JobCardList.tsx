import { useState } from 'react';
import type { Job } from '@shared/types';
import { StatusBadge } from './StatusBadge';
import { TrashIcon } from './icons/TrashIcon';
import { DeleteJobDialog } from './DeleteJobDialog';
import { safeUrl } from '@/lib/jobUtils';
import { formatDate, isDeadlineSoon, isStaleJob } from '@/lib/dateUtils';

interface ListProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  applyingId: string | null;
  deletingId: string | null;
}

function getCardBorderColor(job: Job): string {
  if (['applied', 'archive'].includes(job.status)) return '#e5e7eb'; // gray-200
  if (isDeadlineSoon(job.deadline)) return '#fdba74'; // orange-300
  if (isStaleJob(job.added, job.status)) return '#fde047'; // yellow-300
  return '#e5e7eb'; // gray-200
}

function JobCard({ job, onEdit, onDelete, onMarkApplied, isApplying, isDeleting }: {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  isApplying: boolean;
  isDeleting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const borderColor = getCardBorderColor(job);

  const jobUrl = safeUrl(job.job_link);
  const appUrl = safeUrl(job.app_link);
  const clUrl = safeUrl(job.cover_letter);
  const canMarkApplied = !['applied', 'archive'].includes(job.status);

  return (
    <>
      <div
        className="bg-white rounded-xl p-4 shadow-sm"
        style={{ border: `1px solid ${borderColor}` }}
      >
        {/* Top row: company + status badge */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-bold text-base text-gray-800 leading-tight">{job.company}</p>
            <p className="text-sm text-gray-500">{job.title}</p>
          </div>
          <StatusBadge job={job} />
        </div>

        {/* Meta row: location, dates */}
        <div className="flex flex-wrap gap-3 mt-2 mb-3">
          {job.location && (
            <span className="flex items-center gap-1">
              <span className="text-xs">📍</span>
              <span className="text-xs text-gray-600">{job.location}</span>
            </span>
          )}
          {job.added && (
            <span className="text-xs text-gray-500">Added {formatDate(job.added)}</span>
          )}
          {job.deadline && (
            <span className="text-xs text-orange-500 font-medium">Due {formatDate(job.deadline)}</span>
          )}
          {job.applied_date && (
            <span className="text-xs text-brand-600 font-medium">Applied {formatDate(job.applied_date)}</span>
          )}
          {job.pay && (
            <span className="text-xs text-gray-500">{job.pay}</span>
          )}
        </div>

        {/* Links row */}
        {(jobUrl || appUrl || clUrl) && (
          <div className="flex gap-3 mb-3">
            {jobUrl && <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 font-medium hover:underline">Job Posting ↗</a>}
            {appUrl && <a href={appUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 font-medium hover:underline">Apply ↗</a>}
            {clUrl && <a href={clUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 font-medium hover:underline">Cover Letter ↗</a>}
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{job.notes}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-1">
          {canMarkApplied && (
            <button
              type="button"
              disabled={isApplying}
              onClick={() => onMarkApplied(job.id)}
              className="btn-outline flex-1 text-sm py-1.5"
            >
              {isApplying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </span>
              ) : '✓ Mark Applied'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="btn-outline flex-1 text-sm py-1.5"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setIsOpen(true)}
            className="btn-ghost text-red-600 hover:bg-red-50 px-2 py-1.5"
            aria-label="Delete job"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : <TrashIcon size={16} />}
          </button>
        </div>
      </div>

      <DeleteJobDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        job={job}
        isDeleting={isDeleting}
        onConfirm={() => onDelete(job.id)}
      />
    </>
  );
}

export function JobCardList({ jobs, onEdit, onDelete, onMarkApplied, applyingId, deletingId }: ListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No jobs here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkApplied={onMarkApplied}
          isApplying={applyingId === job.id}
          isDeleting={deletingId === job.id}
        />
      ))}
    </div>
  );
}
