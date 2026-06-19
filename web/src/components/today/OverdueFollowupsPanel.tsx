import { differenceInCalendarDays, parseISO } from 'date-fns';
import { OUTREACH_LABELS, contactName } from '@/lib/contactDisplay';
import type { Contact } from '@shared/schemas';

interface OverdueFollowupsPanelProps {
  contacts: Contact[];
}

function initialsFor(contact: Contact): string {
  return `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
}

function formatLastOutreach(date: string | null): string {
  if (!date) return 'No outreach date';

  const days = differenceInCalendarDays(new Date(), parseISO(date));
  if (days === 0) return 'Last outreach today';
  if (days === 1) return 'Last outreach yesterday';
  return `Last outreach ${days} days ago`;
}

function companyOrAgency(contact: Contact): string {
  return contact.company ?? contact.agency ?? 'No company set';
}

export function OverdueFollowupsPanel({ contacts }: OverdueFollowupsPanelProps) {
  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Overdue follow-ups
        </h3>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {contacts.length}
        </span>
      </div>

      {contacts.length === 0 ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          You're current on follow-ups.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {contacts.map((contact) => (
            <article key={contact.id} className="flex gap-3 px-4 py-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}
                aria-hidden="true"
              >
                {initialsFor(contact)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {contactName(contact)}
                </p>
                <p className="truncate text-xs" style={{ color: 'var(--ink-3)' }}>
                  {companyOrAgency(contact)}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--ink-3)' }}>
                  <span>{formatLastOutreach(contact.date_of_last_outreach)}</span>
                  {contact.outreach_status && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{OUTREACH_LABELS[contact.outreach_status]}</span>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
