import * as Dialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';
import { Spinner } from './Spinner';
import { useForm } from 'react-hook-form';
import type { Job } from '@shared/types';
import { MIN_YEAR_OPTIONS, STATUS_CYCLE } from '@shared/types';
import { STATUS_LABELS } from '@/theme';
import { safeUrl } from '@/lib/jobUtils';

function validateUrl(value: string | null | undefined): true | string {
  if (!value) return true; // optional field
  return safeUrl(value) !== null || 'Must be a valid https:// URL';
}

type FormValues = Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<FormValues>;
  title?: string;
}

import { todayStr } from '@/lib/dateUtils';

const TODAY = todayStr();

export function JobModal({ isOpen, onClose, onSubmit, isLoading, defaultValues, title = 'Add Job' }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      added: TODAY,
      status: 'not_started',
      ...defaultValues,
    } as Partial<FormValues>,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        added: TODAY,
        status: 'not_started',
        ...defaultValues,
      } as Partial<FormValues>);
    }
  }, [isOpen, defaultValues]);

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-brand-50 border-b-2 border-brand-200 px-6 py-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-bold text-brand-800">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-brand-600 hover:text-brand-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="flex flex-col gap-5">

                {/* Row 1: Company + Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Company *</label>
                    <input
                      className="field-input"
                      {...register('company', { required: 'Required' })}
                    />
                    {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>}
                  </div>
                  <div>
                    <label className="field-label">Title *</label>
                    <input
                      className="field-input"
                      {...register('title', { required: 'Required' })}
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
                  </div>
                </div>

                <hr className="border-brand-100" />

                {/* Row 2: Industry + Location + Pay */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="field-label">Industry</label>
                    <input className="field-input" {...register('industry')} />
                  </div>
                  <div>
                    <label className="field-label">Location</label>
                    <input className="field-input" {...register('location')} />
                  </div>
                  <div>
                    <label className="field-label">Pay</label>
                    <input className="field-input" {...register('pay')} placeholder="e.g. $25/hr" />
                  </div>
                </div>

                <hr className="border-brand-100" />

                {/* Row 3: Status + Min Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Status</label>
                    <select className="field-select" {...register('status')}>
                      {STATUS_CYCLE.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Min Year</label>
                    <select className="field-select" {...register('min_year')}>
                      <option value="">Any</option>
                      {MIN_YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr className="border-brand-100" />

                {/* Row 4: Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="field-label">Added</label>
                    <input type="date" className="field-input" {...register('added')} />
                  </div>
                  <div>
                    <label className="field-label">Deadline</label>
                    <input type="date" className="field-input" {...register('deadline')} />
                  </div>
                  <div>
                    <label className="field-label">Applied Date</label>
                    <input type="date" className="field-input" {...register('applied_date')} />
                  </div>
                </div>

                <hr className="border-brand-100" />

                {/* Row 5: Links */}
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Job Link</label>
                      <input type="url" className="field-input" {...register('job_link', { validate: validateUrl })} placeholder="https://" />
                      {errors.job_link && <p className="mt-1 text-xs text-red-600">{errors.job_link.message}</p>}
                    </div>
                    <div>
                      <label className="field-label">Application Link</label>
                      <input type="url" className="field-input" {...register('app_link', { validate: validateUrl })} placeholder="https://" />
                      {errors.app_link && <p className="mt-1 text-xs text-red-600">{errors.app_link.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Cover Letter</label>
                    <input type="url" className="field-input" {...register('cover_letter', { validate: validateUrl })} placeholder="https://" />
                    {errors.cover_letter && <p className="mt-1 text-xs text-red-600">{errors.cover_letter.message}</p>}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        {...register('review')}
                      />
                      <span className="text-sm text-gray-600">Ready for Review</span>
                    </label>
                  </div>
                </div>

                <hr className="border-brand-100" />

                {/* Row 6: Conference + Notes */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="field-label">Conference</label>
                    <input className="field-input" {...register('conference')} />
                  </div>
                  <div>
                    <label className="field-label">Notes</label>
                    <textarea className="field-textarea" {...register('notes')} rows={3} />
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn-ghost text-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary text-sm px-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner color="white" />
                    Saving…
                  </span>
                ) : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
