import { useState } from 'react';
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
  isSaving = false,
  onEditorOpenChange,
}: Props) {
  const [draft, setDraft] = useState<InterviewDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const activeInterview = editingId ? interviews.find((interview) => interview.id === editingId) : null;
  const canEdit = Boolean(onCreate && onUpdate);

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

    const payload = toInterviewInput(draft);
    try {
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
            <InterviewLogItem key={interview.id} interview={interview} onEdit={canEdit ? openEdit : undefined} />
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
    <div className="mb-3 rounded-md border p-3" style={{ borderColor: 'var(--line)', background: 'var(--softer)' }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Type</span>
          <select
            className="field-select"
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
            className="field-input"
            value={draft.scheduled_at}
            onChange={(event) => onChange({ scheduled_at: event.target.value })}
          />
        </label>

        <label className="block">
          <span className="field-label">Status</span>
          <select
            className="field-select"
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
            className="field-select"
            value={draft.outcome}
            onChange={(event) => onChange({ outcome: event.target.value })}
          >
            <option value="">No outcome</option>
            {INTERVIEW_OUTCOME_OPTIONS.map((outcome) => (
              <option key={outcome} value={outcome}>{INTERVIEW_OUTCOME_LABELS[outcome]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Interviewers</span>
          <input
            className="field-input"
            maxLength={MAX_INTERVIEWER_NAMES_LENGTH}
            value={draft.interviewer_names}
            onChange={(event) => onChange({ interviewer_names: event.target.value })}
          />
        </label>

        <label className="block">
          <span className="field-label">Location Link</span>
          <input
            type="url"
            className="field-input"
            maxLength={MAX_URL_LENGTH}
            placeholder="https://"
            value={draft.location_link}
            onChange={(event) => onChange({ location_link: event.target.value })}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="field-label">Notes</span>
        <textarea
          className="field-textarea"
          rows={2}
          maxLength={MAX_NOTES_LENGTH}
          value={draft.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn-ghost text-sm text-gray-600" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary px-3 py-1.5 text-sm" disabled={isSaving} onClick={onSave}>
          {isSaving ? <span className="flex items-center gap-2"><Spinner color="white" size="sm" /> Saving</span> : mode === 'edit' ? 'Update interview' : 'Save interview'}
        </button>
      </div>
    </div>
  );
}

function InterviewLogItem({ interview, onEdit }: { interview: Interview; onEdit?: (interview: Interview) => void }) {
  const typeLabel = INTERVIEW_TYPE_LABELS[interview.interview_type] ?? interview.interview_type;
  const statusLabel = INTERVIEW_STATUS_LABELS[interview.status] ?? interview.status;
  const outcomeLabel = interview.outcome ? INTERVIEW_OUTCOME_LABELS[interview.outcome] ?? interview.outcome : null;

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
