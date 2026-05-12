import * as Dialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Spinner } from './Spinner';
import type { Application, ApplicationStatus, ApplicationType } from '@shared/schemas';
import {
  MAX_COMPANY_LENGTH, MAX_TITLE_LENGTH, MAX_INDUSTRY_LENGTH,
  MAX_LOCATION_LENGTH, MAX_PAY_LENGTH, MAX_NOTES_LENGTH,
} from '@shared/constants';
import { STATUS_LABELS, APPLICATION_TYPE_LABELS } from '@/theme';
import { todayStr } from '@/lib/dateUtils';

const TODAY = todayStr();

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'not_started', 'in_progress', 'applied', 'screening', 'interviewing',
  'technical', 'on_site', 'final_round', 'offered', 'rejected', 'withdrawn', 'archive',
];

const APPLICATION_TYPES: ApplicationType[] = [
  'cold_strategic', 'recruiter_assisted', 'referral', 'other',
];

export type ApplicationFormValues = {
  company: string;
  title: string;
  industry?: string;
  location?: string;
  pay?: string;
  status: ApplicationStatus;
  application_type?: ApplicationType | '';
  added: string;
  applied_date?: string;
  deadline?: string;
  job_link?: string;
  app_link?: string;
  notes?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<Application>;
  title?: string;
}

export function ApplicationModal({ isOpen, onClose, onSubmit, isLoading, defaultValues, title = 'Add Application' }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ApplicationFormValues>({
    defaultValues: { added: TODAY, status: 'not_started', ...defaultValues } as Partial<ApplicationFormValues>,
  });

  useEffect(() => {
    if (isOpen) {
      reset({ added: TODAY, status: 'not_started', ...defaultValues } as Partial<ApplicationFormValues>);
    }
  }, [isOpen, defaultValues, reset]);

  function handleClose() { reset(); onClose(); }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ background: 'var(--soft)', borderColor: 'var(--line)' }}>
            <Dialog.Title className="text-base font-bold" style={{ color: 'var(--ink)' }}>
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="p-1 rounded hover:bg-black/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Company *</label>
                  <input className="field-input" {...register('company', { required: 'Required', maxLength: { value: MAX_COMPANY_LENGTH, message: `Max ${MAX_COMPANY_LENGTH} chars` } })} />
                  {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>}
                </div>
                <div>
                  <label className="field-label">Title *</label>
                  <input className="field-input" {...register('title', { required: 'Required', maxLength: { value: MAX_TITLE_LENGTH, message: `Max ${MAX_TITLE_LENGTH} chars` } })} />
                  {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Industry</label>
                  <input className="field-input" {...register('industry', { maxLength: { value: MAX_INDUSTRY_LENGTH, message: `Max ${MAX_INDUSTRY_LENGTH} chars` } })} />
                </div>
                <div>
                  <label className="field-label">Location</label>
                  <input className="field-input" {...register('location', { maxLength: { value: MAX_LOCATION_LENGTH, message: `Max ${MAX_LOCATION_LENGTH} chars` } })} />
                </div>
                <div>
                  <label className="field-label">Pay</label>
                  <input className="field-input" placeholder="e.g. $25/hr" {...register('pay', { maxLength: { value: MAX_PAY_LENGTH, message: `Max ${MAX_PAY_LENGTH} chars` } })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Status</label>
                  <select className="field-select" {...register('status')}>
                    {APPLICATION_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Application Type</label>
                  <select className="field-select" {...register('application_type')}>
                    <option value="">Not set</option>
                    {APPLICATION_TYPES.map(t => (
                      <option key={t} value={t}>{APPLICATION_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Added</label>
                  <input type="date" className="field-input" {...register('added')} />
                </div>
                <div>
                  <label className="field-label">Applied Date</label>
                  <input type="date" className="field-input" {...register('applied_date')} />
                </div>
                <div>
                  <label className="field-label">Deadline</label>
                  <input type="date" className="field-input" {...register('deadline')} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Job Link</label>
                  <input type="url" className="field-input" placeholder="https://" {...register('job_link')} />
                </div>
                <div>
                  <label className="field-label">Application Link</label>
                  <input type="url" className="field-input" placeholder="https://" {...register('app_link')} />
                </div>
              </div>

              <div>
                <label className="field-label">Notes</label>
                <textarea className="field-textarea" rows={3} {...register('notes', { maxLength: { value: MAX_NOTES_LENGTH, message: `Max ${MAX_NOTES_LENGTH} chars` } })} />
                {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
              </div>

            </div>

            <div className="px-6 py-4 flex justify-end gap-2 border-t bg-gray-50" style={{ borderColor: 'var(--line)' }}>
              <button type="button" onClick={handleClose} className="btn-ghost text-sm text-gray-600">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary text-sm px-6">
                {isLoading ? <span className="flex items-center gap-2"><Spinner color="white" /> Saving…</span> : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
