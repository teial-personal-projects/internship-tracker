import type { Contact } from '@/api/contacts.api';
import type { ContactType } from '@shared/schemas';
import { formatDate } from '@/lib/dateUtils';
import { CONTACT_TYPE_LABELS, OUTREACH_LABELS, RECRUITER_LABELS, contactName } from '@/lib/contactDisplay';
import { Users } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Fragment, useState, type ReactNode } from 'react';
import { Spinner } from './Spinner';
import { TrashIcon } from './icons/TrashIcon';

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
  showQuickAction?: boolean;
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
  deletingContactId?: string | null;
}

export function ContactsList({
  contacts,
  applicationById,
  isLoading,
  error,
  selectedContactId,
  onSelectContact,
  renderDetail,
  showQuickAction = false,
  onEdit,
  onDelete,
  deletingContactId,
}: Props) {
  const [confirmDeleteContact, setConfirmDeleteContact] = useState<Contact | null>(null);
  const showActions = Boolean(onEdit || onDelete);
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
            {showQuickAction && (
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Action</th>
            )}
            {showActions && <th className="px-3 py-2" />}
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
                    <p className="text-sm" style={{ color: (app || contact.company) ? 'var(--ink-2)' : 'var(--ink-4)' }}>
                      {app?.company ?? contact.company ?? 'Not linked'}
                    </p>
                    {app && <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{app.title}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <StatusTag contact={contact} />
                  </td>
                  <td className="px-3 py-3 text-sm" style={{ color: 'var(--ink-3)' }}>
                    {formatDate(contact.date_of_last_outreach)}
                  </td>
                  {showQuickAction && (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="btn-outline text-xs px-3 py-1"
                        onClick={() => onSelectContact?.(contact)}
                      >
                        {selectedContactId === contact.id ? 'Close' : 'Details'}
                      </button>
                    </td>
                  )}
                  {showActions && (
                    <td className="px-3 py-3 sticky right-0 bg-white" style={{ boxShadow: '-2px 0 6px rgba(0,0,0,0.05)' }}>
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(contact)}
                            className="btn-outline text-xs px-2 py-1"
                            style={{ color: 'var(--accent-dark)', borderColor: 'var(--accent-soft)' }}
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            disabled={deletingContactId === contact.id}
                            onClick={() => setConfirmDeleteContact(contact)}
                            className="btn-ghost text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                            aria-label="Delete"
                          >
                            {deletingContactId === contact.id ? <Spinner size="sm" color="red" /> : <TrashIcon />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {selectedContactId === contact.id && renderDetail && (
                  <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
                    <td className="bg-gray-50 p-3" colSpan={(showQuickAction ? 6 : 5) + (showActions ? 1 : 0)}>
                      {renderDetail(contact)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <AlertDialog.Root
        open={confirmDeleteContact !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteContact(null); }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm mx-4 p-6">
            <AlertDialog.Title className="text-base font-bold mb-2" style={{ color: 'var(--ink)' }}>
              Delete Contact
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>
              Delete <strong>{confirmDeleteContact ? contactName(confirmDeleteContact) : ''}</strong>? This cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button type="button" className="btn-ghost text-sm text-gray-600">Cancel</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDeleteContact) {
                      onDelete?.(confirmDeleteContact.id);
                      setConfirmDeleteContact(null);
                    }
                  }}
                  className="btn-danger text-sm"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
