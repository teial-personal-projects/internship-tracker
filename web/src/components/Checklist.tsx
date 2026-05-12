import { useState, useEffect } from 'react';
import { useUpdateApplication } from '@/hooks/useApplications';
import type { Application, ApplicationType } from '@shared/schemas';

const CHECKLIST_TOTAL = 18;

// Must stay in sync with api/src/lib/checklist.ts NA_STEPS
const NA_STEPS: Partial<Record<ApplicationType, Set<string>>> = {
  recruiter_assisted: new Set([
    'step_6', 'step_7', 'step_8',
    'step_9', 'step_10', 'step_11', 'step_12',
  ]),
  referral: new Set(['step_9', 'step_10', 'step_11', 'step_12']),
};

interface ChecklistStep {
  id: string;
  label: string;
}

interface ChecklistPhase {
  label: string;
  steps: ChecklistStep[];
}

const PHASES: ChecklistPhase[] = [
  {
    label: 'Before You Apply',
    steps: [
      { id: 'step_1', label: "Research the company's engineering culture and tech blog" },
      { id: 'step_2', label: 'Find your personalized "in" (specific detail for the cover letter)' },
      { id: 'step_3', label: 'Write your cover letter (120–150 words)' },
      { id: 'step_4', label: 'Identify the right person to send a double-down email to' },
      { id: 'step_5', label: 'Draft your double-down email' },
    ],
  },
  {
    label: 'Day 0',
    steps: [
      { id: 'step_6', label: 'Submit application on company website or LinkedIn' },
      { id: 'step_7', label: 'Send your cover letter / application message' },
      { id: 'step_8', label: 'Save cover letter as a reusable template' },
      { id: 'step_9', label: "Find contact's email address (Hunter.io, Apollo.io, etc.)" },
      { id: 'step_10', label: 'Send double-down email to contact' },
      { id: 'step_11', label: 'Add contact to the Contacts tab' },
      { id: 'step_12', label: 'Set outreach status to "Double Down Sent"' },
    ],
  },
  {
    label: 'Day 4–5 Follow-Up',
    steps: [
      { id: 'step_13', label: 'Check for a reply from your contact' },
      { id: 'step_14', label: 'Send follow-up email (reply to your double-down thread)' },
    ],
  },
  {
    label: 'After a Phone Screen',
    steps: [
      { id: 'step_15', label: 'No response — consider moving on' },
      { id: 'step_16', label: 'Confirm phone screen details and prepare thoroughly' },
      { id: 'step_17', label: 'Send thank-you notes to every interviewer (within 24 hours)' },
      { id: 'step_18', label: 'Log interview outcome and plan next steps' },
    ],
  },
];

function normalizeState(raw: Record<string, unknown>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === true) out[k] = true;
  }
  return out;
}

function progressColor(done: number): string {
  if (done === 0) return 'var(--ink-4)';
  if (done >= 15) return '#15803D';
  if (done >= 5) return '#A36410';
  return '#B5394A';
}

interface Props {
  application: Application;
}

export function Checklist({ application }: Props) {
  const updateApp = useUpdateApplication();

  const naSteps: Set<string> =
    (application.application_type
      ? NA_STEPS[application.application_type as ApplicationType]
      : undefined) ?? new Set();

  const [state, setState] = useState<Record<string, boolean>>(() =>
    normalizeState(application.checklist_state as Record<string, unknown>),
  );

  // Sync from server after query invalidation refetches the application
  useEffect(() => {
    setState(normalizeState(application.checklist_state as Record<string, unknown>));
  }, [application.checklist_state]);

  const doneCount = Object.values(state).filter(Boolean).length;
  const progressPct = Math.round((doneCount / CHECKLIST_TOTAL) * 100);
  const color = progressColor(doneCount);

  function handleToggle(stepId: string) {
    const next = { ...state };
    if (next[stepId]) {
      delete next[stepId];
    } else {
      next[stepId] = true;
    }
    setState(next);
    updateApp.mutate({ id: application.id, data: { checklist_state: next } });
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color }}>
            {doneCount} of {CHECKLIST_TOTAL} complete
          </span>
          <span className="text-xs" style={{ color: 'var(--ink-4)' }}>{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--soft)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: color }}
          />
        </div>
      </div>

      {/* Phases */}
      {PHASES.map((phase) => (
        <div key={phase.label} className="flex flex-col gap-0.5">
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-1"
            style={{ color: 'var(--ink-3)' }}
          >
            {phase.label}
          </p>

          {phase.steps.map((step) => {
            const isNA = naSteps.has(step.id);
            const isChecked = state[step.id] === true;

            return (
              <label
                key={step.id}
                className={[
                  'flex items-start gap-2.5 px-1.5 py-1 rounded select-none',
                  isNA
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-gray-50',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isNA || updateApp.isPending}
                  onChange={() => handleToggle(step.id)}
                  className="mt-0.5 shrink-0"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span
                  className={['text-sm leading-snug', isChecked && !isNA ? 'line-through' : ''].join(' ')}
                  style={{ color: isNA || isChecked ? 'var(--ink-3)' : 'var(--ink-2)' }}
                >
                  {step.label}
                  {isNA && (
                    <span
                      className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--ink-4)' }}
                    >
                      N/A
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
