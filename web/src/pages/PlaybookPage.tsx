import {
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Send,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/AppHeader';

interface PlaybookStep {
  step: string;
  title: string;
  Icon: LucideIcon;
  accent: string;
  tint: string;
  items: string[];
}

const steps: PlaybookStep[] = [
  {
    step: 'Step 1',
    title: 'Before you apply',
    Icon: Target,
    accent: '#C85A3A',
    tint: '#F7D9CD',
    items: [
      'Research engineering blog — find a post by a named engineer',
      'Check eng lead’s LinkedIn for talks, posts, or prior background',
      'Look up the tech stack with Wappalyzer, StackShare, or the job description',
      'Draft a personalized “in” — not from the job description',
      'Write 2x credibility signals: OSS project, talk, technical opinion, or strong team signal',
      'Find double-down target name and email',
    ],
  },
  {
    step: 'Step 2',
    title: 'Day 0 — when you apply',
    Icon: Send,
    accent: '#B57925',
    tint: '#F6E7BE',
    items: [
      'Apply on company website or LinkedIn',
      'Attach message with 2x credibility + 1x personalized in',
      'Confirm message is under 150 words with no job-description mirroring',
      'Send double-down email to named target same day',
      'Set follow-up reminder for 4-5 business days',
      'Log contact with status: Double-down sent',
    ],
  },
  {
    step: 'Step 3',
    title: 'Day 4-5 — follow-up',
    Icon: Clock3,
    accent: '#6F5FB5',
    tint: '#DDD7F0',
    items: [
      'Reply to double-down thread with a 1-2 sentence follow-up',
      'Update contact status to: Follow-up sent',
      'Add one new useful signal if you have it',
      'Ask whether there is a better person to speak with',
      'Move on unless the company is unusually high priority',
    ],
  },
  {
    step: 'Step 4',
    title: 'After a screen or interview',
    Icon: Mail,
    accent: '#5B8A75',
    tint: '#D9E8DE',
    items: [
      'Send a thank-you note within 24 hours',
      'Reference one specific part of the conversation',
      'Add interview notes to the application history',
      'Create any prep tasks for the next interview round',
      'Update the application status if the company moves you forward',
    ],
  },
];

const coverLetterRules = [
  'Keep the cover letter 120-150 words.',
  'Use 2x engineering credibility signals.',
  'Use 1x personalized “in” — the cover letter differentiator.',
  'Use a direct, casual close like “All best” or “Cheers”.',
  'Avoid formal cover-letter language and dense punctuation.',
];

const recipientRules = [
  ['Under 20 people', 'CEO or founder'],
  ['20-200 people', 'CTO or engineering lead'],
  ['200-2,000 people', 'Engineering manager or team lead'],
  ['Large company', 'Engineer on the target team; start with an informational note'],
];

function StepCard({ step }: { step: PlaybookStep }) {
  const Icon = step.Icon;

  return (
    <section className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <header className="flex items-center gap-4 px-4 py-4 sm:px-5" style={{ background: step.tint }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white" style={{ color: step.accent }}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: step.accent }}>
            {step.step}
          </p>
          <h2 className="mt-0.5 text-lg font-bold leading-tight" style={{ color: 'var(--ink)' }}>
            {step.title}
          </h2>
        </div>
      </header>

      <ol className="divide-y" style={{ borderColor: 'var(--line)' }}>
        {step.items.map((item, index) => (
          <li key={item} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 px-4 py-3 sm:px-5">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
              {index + 1}
            </span>
            <span className="text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
              {item}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReferencePanel({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-4 sm:p-5" style={{ borderColor: 'var(--line)' }}>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
          <Icon size={17} strokeWidth={1.8} />
        </div>
        <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function PlaybookPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />

      <main className="mobile-safe-bottom flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:pb-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Playbook
            </p>
            <h1 className="mt-1 text-3xl font-bold" style={{ color: 'var(--ink)', fontFamily: "'Fraunces', serif" }}>
              Application loop
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
              Repeat this loop for every target. Keep the checklist read-only here; use applications, contacts, and action items to track the actual work.
            </p>
          </header>

          <div className="space-y-4">
            {steps.map((step) => (
              <StepCard key={step.step} step={step} />
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ReferencePanel title="Cover letter rules" Icon={FileText}>
              <ul className="space-y-2">
                {coverLetterRules.map((rule) => (
                  <li key={rule} className="flex gap-2 text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
                    <CheckCircle2 size={16} className="mt-1 shrink-0" strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </ReferencePanel>

            <ReferencePanel title="Double-down target" Icon={Users}>
              <div className="divide-y rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                {recipientRules.map(([companySize, target]) => (
                  <div key={companySize} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 px-3 py-2.5">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
                      {companySize}
                    </p>
                    <p className="text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
                      {target}
                    </p>
                  </div>
                ))}
              </div>
            </ReferencePanel>
          </div>

        </div>
      </main>
    </div>
  );
}
