import type { Contact } from '@/api/contacts.api';
import type { ContactType } from '@shared/schemas';
import { formatDate } from '@/lib/dateUtils';
import { CONTACT_TYPE_LABELS, OUTREACH_LABELS, RECRUITER_LABELS, contactName } from '@/lib/contactDisplay';
import { BriefcaseBusiness, Mail, Phone, Users } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useState, type ReactNode } from 'react';
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

function initialsFor(contact: Contact): string {
  return `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
}

function cardTintFor(contact: Contact): string {
  if (contact.contact_type === 'recruiter') {
    return contact.recruiter_status === 'active' ? '#F7D9CD' : '#F3E9D7';
  }

  return contact.outreach_status === 'replied' ? '#DDE8DF' : '#F3E9D7';
}

function contactSubtitle(contact: Contact): string {
  if (contact.contact_type === 'recruiter') return contact.agency ?? 'External recruiter';
  return contact.title ?? contact.company ?? 'Company contact';
}

function contactNote(contact: Contact): string {
  if (contact.notes) return contact.notes;
  if (contact.contact_type === 'recruiter') return 'Track roles, outreach, and recruiter preferences.';
  return 'Track outreach, notes, and linked applications.';
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

  const selectedContact = selectedContactId
    ? contacts.find((contact) => contact.id === selectedContactId)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {contacts.map((contact) => {
          const app = contact.application_id ? applicationById.get(contact.application_id) : undefined;
          const linkedRoleCount = app ? 1 : 0;

          return (
            <article
              key={contact.id}
              className="overflow-hidden rounded-xl border bg-white"
              style={{ borderColor: selectedContactId === contact.id ? 'var(--accent)' : 'var(--line)' }}
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3 text-left"
                style={{ background: cardTintFor(contact) }}
                onClick={() => onSelectContact?.(contact)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold" style={{ color: 'var(--ink)' }}>
                  {initialsFor(contact)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold" style={{ color: 'var(--ink)' }}>
                    {contactName(contact)}
                  </span>
                  <span className="block truncate text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                    {contactSubtitle(contact)}
                  </span>
                </span>
                <StatusTag contact={contact} />
              </button>

              <div className="flex flex-col gap-3 p-4">
                <p className="line-clamp-2 min-h-10 text-sm italic leading-5" style={{ color: 'var(--ink-2)' }}>
                  "{contactNote(contact)}"
                </p>

                <div className="flex flex-wrap gap-2">
                  <ContactTypeBadge type={contact.contact_type} />
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
                    <BriefcaseBusiness size={12} strokeWidth={1.75} />
                    {app?.company ?? contact.company ?? 'Not linked'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>
                  {contact.email && (
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-1" style={{ background: 'var(--soft)' }}>
                      <Mail size={12} strokeWidth={1.75} />
                      <span className="max-w-44 truncate">{contact.email}</span>
                    </span>
                  )}
                  {contact.phone && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: 'var(--soft)' }}>
                      <Phone size={12} strokeWidth={1.75} />
                      {contact.phone}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3" style={{ background: 'var(--soft)' }}>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                      {linkedRoleCount}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                      Linked roles
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--soft)' }}>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                      {formatDate(contact.date_of_last_outreach)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                      Last outreach
                    </p>
                  </div>
                </div>

                {(showQuickAction || showActions) && (
                  <div className="flex items-center justify-end gap-2">
                    {showQuickAction && (
                      <button
                        type="button"
                        className="btn-outline px-3 py-1 text-xs"
                        onClick={() => onSelectContact?.(contact)}
                      >
                        {selectedContactId === contact.id ? 'Close' : 'Details'}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(contact)}
                        className="btn-outline px-3 py-1 text-xs"
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
                        className="btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        {deletingContactId === contact.id ? <Spinner size="sm" color="red" /> : <TrashIcon />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {selectedContact && renderDetail && (
        <div>
          {renderDetail(selectedContact)}
        </div>
      )}

      <AlertDialog.Root
        open={confirmDeleteContact !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteContact(null); }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <AlertDialog.Content className="app-confirm-content">
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
