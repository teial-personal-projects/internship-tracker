import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Interview } from '@shared/schemas';
import type { CreateApplicationInterviewInput, UpdateApplicationInterviewInput } from '@/api/applications.api';
import { Spinner } from '@/components/Spinner';
import { formatDate } from '@/lib/dateUtils';
import { INTERVIEW_TYPE_LABELS } from '@/theme';
import {
  MAX_INTERVIEWER_NAMES_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_URL_LENGTH,
} from '@shared/constants';

const CREATE_INTERVIEW_TYPE_OPTIONS = [
  'recruiter_screen',
  'coding',
  'system_design',
  'behavioral',
  'hiring_manager',
  'final',
] as const;

const LEGACY_INTERVIEW_TYPE_OPTIONS = [
  'phone_screen',
  'screening',
  'technical',
  'on_site',
  'final_round',
] as const;

const INTERVIEW_STATUS_OPTIONS = ['scheduled', 'completed', 'cancelled'] as const;
const INTERVIEW_OUTCOME_OPTIONS = ['passed', 'rejected', 'withdrawn', 'no_decision_yet'] as const;

const INTERVIEW_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const INTERVIEW_OUTCOME_LABELS: Record<string, string> = {
  passed: 'Passed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  no_decision_yet: 'No decision yet',
};

interface Props {
  interviews: Interview[];
  isLoading: boolean;
  isError: boolean;
  onCreate?: (input: CreateApplicationInterviewInput) => Promise<unknown> | unknown;
  onUpdate?: (interviewId: string, input: UpdateApplicationInterviewInput) => Promise<unknown> | unknown;
  onDelete?: (interviewId: string) => Promise<unknown> | unknown;
  isSaving?: boolean;
  onEditorOpenChange?: (open: boolean) => void;
}

type InterviewDraft = {
  interview_type: string;
  scheduled_at: string;
  interviewer_names: string;
  location_link: string;
  notes: string;
  status: string;
  outcome: string;
};

export function ApplicationInterviewLog({
  interviews,
  isLoading,
  isError,
  onCreate,
  onUpdate,
  onDelete,
  isSaving = false,
  onEditorOpenChange,
}: Props) {
  const [draft, setDraft] = useState<InterviewDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const activeInterview = editingId ? interviews.find((interview) => interview.id === editingId) : null;
  const canEdit = Boolean(onCreate && onUpdate);
  const canDelete = Boolean(onDelete);

  function openCreate() {
    setDraft(createEmptyDraft());
    setEditingId(null);
    setFormError('');
    setIsEditorOpen(true);
    onEditorOpenChange?.(true);
  }

  function openEdit(interview: Interview) {
    setDraft(createDraftFromInterview(interview));
    setEditingId(interview.id);
    setFormError('');
    setIsEditorOpen(true);
    onEditorOpenChange?.(true);
  }

  function closeEditor() {
    setDraft(createEmptyDraft());
    setEditingId(null);
    setFormError('');
    setIsEditorOpen(false);
    onEditorOpenChange?.(false);
  }

  async function saveInterview() {
    if (!draft.scheduled_at) {
      setFormError('Scheduled time is required.');
      return;
    }

    try {
      const payload = toInterviewInput(draft);
      if (editingId) {
        await onUpdate?.(editingId, payload);
      } else {
        await onCreate?.(payload as CreateApplicationInterviewInput);
      }
      closeEditor();
    } catch {
      setFormError('Could not save interview.');
    }
  }

  return (
    <section className="rounded-lg border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Interview History
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-3)' }}>
            {interviews.length}
          </span>
          {canEdit && (
            <button type="button" onClick={openCreate} className="btn-outline px-2 py-1 text-xs">
              Add interview
            </button>
          )}
        </div>
      </div>

      {isEditorOpen && (
        <InterviewEditor
          draft={draft}
          mode={editingId ? 'edit' : 'create'}
          currentType={activeInterview?.interview_type}
          error={formError}
          isSaving={isSaving}
          onChange={(patch) => { setDraft((current) => ({ ...current, ...patch })); setFormError(''); }}
          onCancel={closeEditor}
          onSave={saveInterview}
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-sm" style={{ color: 'var(--ink-3)' }}>
          <Spinner size="sm" /> Loading interviews
        </div>
      ) : isError ? (
        <p className="text-sm" style={{ color: 'var(--rose)' }}>
          Failed to load interviews.
        </p>
      ) : interviews.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
          No interviews logged for this application.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {interviews.map((interview) => (
            <InterviewLogItem
              key={interview.id}
              interview={interview}
              isSaving={isSaving}
              onEdit={canEdit ? openEdit : undefined}
              onDelete={canDelete ? onDelete : undefined}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function InterviewEditor({
  draft,
  mode,
  currentType,
  error,
  isSaving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: InterviewDraft;
  mode: 'create' | 'edit';
  currentType?: string;
  error: string;
  isSaving: boolean;
  onChange: (patch: Partial<InterviewDraft>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mb-3 rounded-md border p-2.5" style={{ borderColor: 'var(--line)', background: 'var(--softer)' }}>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-3)' }}>
          {mode === 'edit' ? 'Edit interview' : 'New interview'}
        </h4>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost px-2 py-1 text-xs text-gray-600" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary px-2.5 py-1 text-xs" disabled={isSaving} onClick={onSave}>
            {isSaving ? <span className="flex items-center gap-1.5"><Spinner color="white" size="sm" /> Saving</span> : mode === 'edit' ? 'Update interview' : 'Save interview'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="field-label">Type</span>
          <select
            className="field-select min-h-9 py-1 text-sm"
            value={draft.interview_type}
            onChange={(event) => onChange({ interview_type: event.target.value })}
          >
            {getInterviewTypeOptions(currentType).map((type) => (
              <option key={type} value={type}>{INTERVIEW_TYPE_LABELS[type] ?? type}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Scheduled</span>
          <input
            type="datetime-local"
            className="field-input min-h-9 py-1 text-sm"
            value={draft.scheduled_at}
            onChange={(event) => onChange({ scheduled_at: event.target.value })}
          />
        </label>

        <label className="block">
          <span className="field-label">Status</span>
          <select
            className="field-select min-h-9 py-1 text-sm"
            value={draft.status}
            onChange={(event) => onChange({ status: event.target.value })}
          >
            {INTERVIEW_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{INTERVIEW_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Outcome</span>
          <select
            className="field-select min-h-9 py-1 text-sm"
            value={draft.outcome}
            onChange={(event) => onChange({ outcome: event.target.value })}
          >
            <option value="">No outcome</option>
            {INTERVIEW_OUTCOME_OPTIONS.map((outcome) => (
              <option key={outcome} value={outcome}>{INTERVIEW_OUTCOME_LABELS[outcome]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Interviewers</span>
          <input
            className="field-input min-h-9 py-1 text-sm"
            maxLength={MAX_INTERVIEWER_NAMES_LENGTH}
            value={draft.interviewer_names}
            onChange={(event) => onChange({ interviewer_names: event.target.value })}
          />
        </label>

        <label className="block">
          <span className="field-label">Location Link</span>
          <input
            type="url"
            className="field-input min-h-9 py-1 text-sm"
            maxLength={MAX_URL_LENGTH}
            placeholder="https://"
            value={draft.location_link}
            onChange={(event) => onChange({ location_link: event.target.value })}
          />
        </label>
      </div>

      <label className="mt-2 block">
        <span className="field-label">Notes</span>
        <textarea
          className="field-textarea min-h-16 py-1 text-sm"
          rows={1}
          maxLength={MAX_NOTES_LENGTH}
          value={draft.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function InterviewLogItem({
  interview,
  isSaving,
  onEdit,
  onDelete,
}: {
  interview: Interview;
  isSaving: boolean;
  onEdit?: (interview: Interview) => void;
  onDelete?: (interviewId: string) => Promise<unknown> | unknown;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const typeLabel = INTERVIEW_TYPE_LABELS[interview.interview_type] ?? interview.interview_type;
  const statusLabel = INTERVIEW_STATUS_LABELS[interview.status] ?? interview.status;
  const outcomeLabel = interview.outcome ? INTERVIEW_OUTCOME_LABELS[interview.outcome] ?? interview.outcome : null;

  async function handleDelete() {
    await onDelete?.(interview.id);
    setConfirmOpen(false);
  }

  return (
    <li className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--line-soft)', background: 'var(--softer)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {typeLabel}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-3)' }}>
            {formatInterviewDate(interview.scheduled_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
            {statusLabel}
          </span>
          {onEdit && (
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onEdit(interview)}>
              Edit
            </button>
          )}
          {onDelete && (
            <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialog.Trigger asChild>
                <button type="button" className="btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <AlertDialog.Content
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-xl"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <AlertDialog.Title className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                    Delete Interview
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm" style={{ color: 'var(--ink-3)' }}>
                    Delete this {typeLabel.toLowerCase()} interview record? This cannot be undone.
                  </AlertDialog.Description>
                  <div className="mt-5 flex justify-end gap-2">
                    <AlertDialog.Cancel asChild>
                      <button type="button" className="btn-ghost text-sm text-gray-600">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleDelete}
                        className="btn-danger px-4 py-2 text-sm"
                      >
                        {isSaving ? 'Deleting...' : 'Delete'}
                      </button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          )}
        </div>
      </div>

      {(interview.interviewer_names || outcomeLabel || interview.notes) && (
        <div className="mt-2 flex flex-col gap-1 text-xs" style={{ color: 'var(--ink-3)' }}>
          {interview.interviewer_names && <p>With {interview.interviewer_names}</p>}
          {outcomeLabel && <p>Outcome: {outcomeLabel}</p>}
          {interview.notes && <p className="line-clamp-2">{interview.notes}</p>}
        </div>
      )}
    </li>
  );
}

function createEmptyDraft(): InterviewDraft {
  return {
    interview_type: 'coding',
    scheduled_at: '',
    interviewer_names: '',
    location_link: '',
    notes: '',
    status: 'scheduled',
    outcome: '',
  };
}

function createDraftFromInterview(interview: Interview): InterviewDraft {
  return {
    interview_type: interview.interview_type,
    scheduled_at: toDatetimeLocalValue(interview.scheduled_at),
    interviewer_names: interview.interviewer_names ?? '',
    location_link: interview.location_link ?? '',
    notes: interview.notes ?? '',
    status: interview.status,
    outcome: interview.outcome ?? '',
  };
}

function toInterviewInput(draft: InterviewDraft): CreateApplicationInterviewInput {
  return {
    interview_type: draft.interview_type as CreateApplicationInterviewInput['interview_type'],
    scheduled_at: new Date(draft.scheduled_at).toISOString(),
    interviewer_names: nullableText(draft.interviewer_names),
    location_link: nullableText(draft.location_link),
    notes: nullableText(draft.notes),
    status: draft.status as CreateApplicationInterviewInput['status'],
    outcome: draft.outcome ? draft.outcome as CreateApplicationInterviewInput['outcome'] : null,
  };
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getInterviewTypeOptions(currentType?: string) {
  const values: string[] = [...CREATE_INTERVIEW_TYPE_OPTIONS];
  if (currentType && !values.includes(currentType)) {
    values.push(currentType);
  }
  return values;
}

function formatInterviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
