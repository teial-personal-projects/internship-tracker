import type { Contact, ContactInteraction, ContactTemplate } from '@/api/contacts.api';
import { Spinner } from '@/components/Spinner';
import {
  useContactInteractions,
  useContactTemplates,
  useCreateContactInteraction,
  useCreateContactTemplate,
  useUpdateContact,
} from '@/hooks/useContacts';
import {
  CONTACT_TYPE_LABELS,
  OUTREACH_LABELS,
  RECRUITER_LABELS,
  contactName,
} from '@/lib/contactDisplay';
import { formatDate } from '@/lib/dateUtils';
import type {
  ContactInteractionType,
  ContactTemplateType,
  OutreachStatus,
  RecruiterStatus,
} from '@shared/schemas';
import { MessageSquarePlus, Plus, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const INTERACTION_PURPOSES: Array<{ value: ContactInteractionType; label: string }> = [
  { value: 'application_message', label: 'Application message' },
  { value: 'double_down', label: 'Double-down' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'reply_received', label: 'Reply received' },
  { value: 'phone_screen_confirmed', label: 'Phone screen confirmed' },
  { value: 'initial_contact', label: 'Initial contact' },
  { value: 'role_discussion', label: 'Role discussion' },
  { value: 'resume_submitted', label: 'Resume submitted' },
  { value: 'role_update', label: 'Role update' },
  { value: 'feedback_received', label: 'Feedback received' },
  { value: 'note', label: 'Note' },
];

const TEMPLATE_TYPES: Array<{ value: ContactTemplateType; label: string }> = [
  { value: 'email_format', label: 'Email format' },
  { value: 'resume_version', label: 'Resume version' },
  { value: 'intro_pitch', label: 'Intro pitch' },
  { value: 'cover_letter', label: 'Cover letter' },
  { value: 'other', label: 'Other' },
];

const HOW_FOUND_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  company_site: 'Company site',
  referral: 'Referral',
  other: 'Other',
};

const CONTACT_METHOD_LABELS: Record<string, string> = {
  email: 'Email',
  linkedin: 'LinkedIn',
  phone: 'Phone',
  text: 'Text',
};

function toDateTimeLocal(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function fieldValue(value?: string | null): string {
  return value?.trim() || '-';
}

interface Props {
  contact: Contact;
  application?: { company: string; title: string };
}

export function ContactDetailPanel({ contact, application }: Props) {
  const [interactionPurpose, setInteractionPurpose] = useState<ContactInteractionType>('note');
  const [interactionBody, setInteractionBody] = useState('');
  const [interactionOccurredAt, setInteractionOccurredAt] = useState(() => toDateTimeLocal(new Date()));
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<ContactTemplateType | ''>('');
  const [templateBody, setTemplateBody] = useState('');

  const interactions = useContactInteractions(contact.id);
  const templates = useContactTemplates(contact.id);
  const updateContact = useUpdateContact();
  const createInteraction = useCreateContactInteraction();
  const createTemplate = useCreateContactTemplate();

  const statusOptions = useMemo(() => (
    contact.contact_type === 'recruiter'
      ? Object.entries(RECRUITER_LABELS)
      : Object.entries(OUTREACH_LABELS)
  ), [contact.contact_type]);

  const currentStatus = contact.contact_type === 'recruiter'
    ? contact.recruiter_status
    : contact.outreach_status;

  async function handleStatusChange(value: string) {
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        data: contact.contact_type === 'recruiter'
          ? { recruiter_status: value as RecruiterStatus }
          : { outreach_status: value as OutreachStatus },
      });
      toast.success('Contact status updated');
    } catch {
      toast.error('Could not update contact status');
    }
  }

  async function handleCreateInteraction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createInteraction.mutateAsync({
        id: contact.id,
        data: {
          purpose: interactionPurpose,
          body: interactionBody.trim() || null,
          occurred_at: new Date(interactionOccurredAt).toISOString(),
        },
      });
      setInteractionPurpose('note');
      setInteractionBody('');
      setInteractionOccurredAt(toDateTimeLocal(new Date()));
      toast.success('Interaction added');
    } catch {
      toast.error('Could not add interaction');
    }
  }

  async function handleCreateTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createTemplate.mutateAsync({
        id: contact.id,
        data: {
          name: templateName.trim(),
          template_type: templateType || null,
          body: templateBody.trim() || null,
        },
      });
      setTemplateName('');
      setTemplateType('');
      setTemplateBody('');
      setIsAddingTemplate(false);
      toast.success('Template added');
    } catch {
      toast.error('Could not add template');
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: 'var(--line)' }}>
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>{contactName(contact)}</h3>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
            {CONTACT_TYPE_LABELS[contact.contact_type]} {application ? `for ${application.company}` : ''}
          </p>
        </div>
        <label className="min-w-48">
          <span className="field-label">Quick Status</span>
          <select
            className="field-select"
            value={currentStatus ?? ''}
            onChange={(event) => handleStatusChange(event.target.value)}
            disabled={updateContact.isPending}
          >
            <option value="">Not set</option>
            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DetailField label="Title" value={fieldValue(contact.title)} />
        <DetailField label="Email" value={fieldValue(contact.email)} />
        <DetailField label="Phone" value={fieldValue(contact.phone)} />
        <DetailField label="LinkedIn" value={fieldValue(contact.linkedin_url)} />
        <DetailField label="Linked Company" value={application ? `${application.company} - ${application.title}` : 'Not linked'} />
        <DetailField label="Outreach Status" value={contact.outreach_status ? OUTREACH_LABELS[contact.outreach_status] : '-'} />
        <DetailField label="How Found" value={contact.how_found ? HOW_FOUND_LABELS[contact.how_found] : '-'} />
        <DetailField label="Agency" value={fieldValue(contact.agency)} />
        <DetailField label="Preferred Method" value={contact.preferred_contact_method ? CONTACT_METHOD_LABELS[contact.preferred_contact_method] : '-'} />
        <DetailField label="Recruiter Status" value={contact.recruiter_status ? RECRUITER_LABELS[contact.recruiter_status] : '-'} />
        <DetailField label="Last Outreach" value={formatDate(contact.date_of_last_outreach, '-')} />
        <DetailField label="Created" value={formatDateTime(contact.created_at)} />
      </div>

      <div className="mt-4 rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
        <p className="field-label">Notes</p>
        <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--ink-2)' }}>{fieldValue(contact.notes)}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Interaction Log</h4>
          </div>
          <InteractionList interactions={interactions.data ?? []} isLoading={interactions.isLoading} error={interactions.error} />
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleCreateInteraction}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label>
                <span className="field-label">Purpose</span>
                <select className="field-select" value={interactionPurpose} onChange={(event) => setInteractionPurpose(event.target.value as ContactInteractionType)}>
                  {INTERACTION_PURPOSES.map((purpose) => <option key={purpose.value} value={purpose.value}>{purpose.label}</option>)}
                </select>
              </label>
              <label>
                <span className="field-label">Occurred At</span>
                <input className="field-input" type="datetime-local" value={interactionOccurredAt} onChange={(event) => setInteractionOccurredAt(event.target.value)} />
              </label>
            </div>
            <label>
              <span className="field-label">Body</span>
              <textarea className="field-textarea" rows={3} value={interactionBody} onChange={(event) => setInteractionBody(event.target.value)} />
            </label>
            <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2 self-start text-sm px-4 py-2" disabled={createInteraction.isPending}>
              {createInteraction.isPending ? <Spinner color="white" /> : <MessageSquarePlus size={16} />}
              Add Interaction
            </button>
          </form>
        </section>

        <section className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Templates</h4>
            <button type="button" className="btn-ghost inline-flex items-center gap-2 text-sm" onClick={() => setIsAddingTemplate((value) => !value)}>
              <Plus size={16} />
              Add Template
            </button>
          </div>
          <TemplateList templates={templates.data ?? []} isLoading={templates.isLoading} error={templates.error} />
          {isAddingTemplate && (
            <form className="mt-4 flex flex-col gap-3" onSubmit={handleCreateTemplate}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label>
                  <span className="field-label">Name</span>
                  <input className="field-input" value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
                </label>
                <label>
                  <span className="field-label">Template Type</span>
                  <select className="field-select" value={templateType} onChange={(event) => setTemplateType(event.target.value as ContactTemplateType | '')}>
                    <option value="">Not set</option>
                    {TEMPLATE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
              </div>
              <label>
                <span className="field-label">Body</span>
                <textarea className="field-textarea min-h-32" rows={5} value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} />
              </label>
              <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2 self-start text-sm px-4 py-2" disabled={createTemplate.isPending}>
                {createTemplate.isPending ? <Spinner color="white" /> : <Save size={16} />}
                Save Template
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
      <p className="field-label">{label}</p>
      <p className="break-words text-sm" style={{ color: 'var(--ink-2)' }}>{value}</p>
    </div>
  );
}

function InteractionList({ interactions, isLoading, error }: { interactions: ContactInteraction[]; isLoading: boolean; error: unknown }) {
  if (isLoading) return <Spinner />;
  if (error) return <p className="text-sm" style={{ color: '#B91C1C' }}>Could not load interactions.</p>;
  if (interactions.length === 0) return <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No interactions yet.</p>;

  return (
    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
      {interactions.map((interaction) => (
        <article key={interaction.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {INTERACTION_PURPOSES.find((purpose) => purpose.value === interaction.purpose)?.label ?? interaction.purpose}
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{formatDateTime(interaction.occurred_at)}</p>
          </div>
          {interaction.body && <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--ink-2)' }}>{interaction.body}</p>}
        </article>
      ))}
    </div>
  );
}

function TemplateList({ templates, isLoading, error }: { templates: ContactTemplate[]; isLoading: boolean; error: unknown }) {
  if (isLoading) return <Spinner />;
  if (error) return <p className="text-sm" style={{ color: '#B91C1C' }}>Could not load templates.</p>;
  if (templates.length === 0) return <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No templates yet.</p>;

  return (
    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
      {templates.map((template) => (
        <article key={template.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{template.name}</p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {template.template_type
                ? TEMPLATE_TYPES.find((type) => type.value === template.template_type)?.label ?? template.template_type
                : 'No type'}
            </p>
          </div>
          {template.body && <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--ink-2)' }}>{template.body}</p>}
        </article>
      ))}
    </div>
  );
}
