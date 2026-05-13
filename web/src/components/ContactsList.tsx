import type { Contact } from '@/api/contacts.api';
import type { ContactType } from '@shared/schemas';
import { formatDate } from '@/lib/dateUtils';
import { CONTACT_TYPE_LABELS, OUTREACH_LABELS, RECRUITER_LABELS, contactName } from '@/lib/contactDisplay';
import { Users } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { Spinner } from './Spinner';

const OUTREACH_COLORS: Record<string, { bg: string; color: string }> = {
  not_contacted:    { bg: 'var(--soft)', color: 'var(--ink-3)' },
  applied_msg_sent: { bg: '#EFF6FF', color: '#1D4ED8' },
  double_down_sent: { bg: '#F7D9CD', color: '#A8442A' },
  follow_up_sent:   { bg: '#F5E6C4', color: '#A36410' },
  replied:          { bg: '#DDE8DF', color: '#3F6B4F' },
  no_response:      { bg: '#F3D5DA', color: '#B5394A' },
};

const RECRUITER_COLORS: Record<string, { bg: string; color: string }> = {
  active:           { bg: '#DDE8DF', color: '#3F6B4F' },
  inactive:         { bg: 'var(--soft)', color: 'var(--ink-3)' },
  follow_up_needed: { bg: '#F5E6C4', color: '#A36410' },
};

function ContactTypeBadge({ type }: { type: ContactType }) {
  const isRecruiter = type === 'recruiter';
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background: isRecruiter ? '#F5F3FF' : 'var(--soft)',
        color: isRecruiter ? '#6D28D9' : 'var(--ink-2)',
      }}
    >
      {CONTACT_TYPE_LABELS[type] ?? type}
    </span>
  );
}

function StatusTag({ contact }: { contact: Contact }) {
  const status = contact.contact_type === 'recruiter'
    ? contact.recruiter_status
    : contact.outreach_status;

  if (!status) {
    return <span className="text-xs" style={{ color: 'var(--ink-4)' }}>Not set</span>;
  }

  const colors = contact.contact_type === 'recruiter'
    ? RECRUITER_COLORS[status] ?? RECRUITER_COLORS.inactive
    : OUTREACH_COLORS[status] ?? OUTREACH_COLORS.not_contacted;

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: colors.bg, color: colors.color }}
    >
      {contact.contact_type === 'recruiter'
        ? RECRUITER_LABELS[status] ?? status
        : OUTREACH_LABELS[status] ?? status}
    </span>
  );
}

interface Props {
  contacts: Contact[];
  applicationById: Map<string, { company: string; title: string }>;
  isLoading: boolean;
  error: unknown;
  selectedContactId?: string | null;
  onSelectContact?: (contact: Contact) => void;
  renderDetail?: (contact: Contact) => ReactNode;
}

export function ContactsList({
  contacts,
  applicationById,
  isLoading,
  error,
  selectedContactId,
  onSelectContact,
  renderDetail,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#FECACA' }}>
        <p className="text-sm" style={{ color: '#B91C1C' }}>Could not load contacts.</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-12" style={{ borderColor: 'var(--line)' }}>
        <Users size={28} strokeWidth={1.5} style={{ color: 'var(--ink-3)' }} />
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No contacts found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: 'var(--line)' }}>
      <table className="w-full min-w-[820px] border-collapse">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: 'var(--line)' }}>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Contact</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Type</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Company</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Status</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Last outreach</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const app = contact.application_id ? applicationById.get(contact.application_id) : undefined;
            return (
              <Fragment key={contact.id}>
                <tr
                  className="border-b last:border-b-0 hover:bg-gray-50"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="block text-left"
                      onClick={() => onSelectContact?.(contact)}
                    >
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{contactName(contact)}</p>
                      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                        {contact.contact_type === 'recruiter'
                          ? contact.agency || contact.email || 'Recruiter'
                          : contact.title || contact.email || 'Company contact'}
                      </p>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <ContactTypeBadge type={contact.contact_type} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm" style={{ color: app ? 'var(--ink-2)' : 'var(--ink-4)' }}>{app?.company ?? 'Not linked'}</p>
                    {app && <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{app.title}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <StatusTag contact={contact} />
                  </td>
                  <td className="px-3 py-3 text-sm" style={{ color: 'var(--ink-3)' }}>
                    {formatDate(contact.date_of_last_outreach)}
                  </td>
                </tr>
                {selectedContactId === contact.id && renderDetail && (
                  <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
                    <td className="bg-gray-50 p-3" colSpan={5}>
                      {renderDetail(contact)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
