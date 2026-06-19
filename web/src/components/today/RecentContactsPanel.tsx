import { OUTREACH_LABELS, RECRUITER_LABELS, contactName } from '@/lib/contactDisplay';
import type { Contact } from '@shared/schemas';

interface RecentContactsPanelProps {
  contacts: Contact[];
}

function initialsFor(contact: Contact): string {
  return `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
}

function companyOrAgency(contact: Contact): string {
  return contact.company ?? contact.agency ?? 'No company set';
}

function statusLabel(contact: Contact): string {
  if (contact.outreach_status) return OUTREACH_LABELS[contact.outreach_status];
  if (contact.recruiter_status) return RECRUITER_LABELS[contact.recruiter_status];
  return 'No status';
}

export function RecentContactsPanel({ contacts }: RecentContactsPanelProps) {
  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Recent contacts
        </h3>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {contacts.length}
        </span>
      </div>

      {contacts.length === 0 ? (
        <p className="p-4 text-sm" style={{ color: 'var(--ink-3)' }}>
          No contacts yet.
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
                  {[contact.title, companyOrAgency(contact)].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
                  {statusLabel(contact)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
