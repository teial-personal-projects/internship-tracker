import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Spinner } from './Spinner';
import type {
  ContactType,
  CreateContactSchemaType,
  HowFound,
  OutreachStatus,
  PreferredContactMethod,
  RecruiterStatus,
} from '@shared/schemas';
import type { Application } from '@shared/schemas';

const CONTACT_TYPES: Array<{ value: ContactType; label: string }> = [
  { value: 'company_contact', label: 'Company' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'other', label: 'Other' },
];

const OUTREACH_STATUSES: Array<{ value: OutreachStatus; label: string }> = [
  { value: 'not_contacted', label: 'Not contacted' },
  { value: 'applied_msg_sent', label: 'Applied message sent' },
  { value: 'double_down_sent', label: 'Double-down sent' },
  { value: 'follow_up_sent', label: 'Follow-up sent' },
  { value: 'replied', label: 'Replied' },
  { value: 'no_response', label: 'No response' },
];

const HOW_FOUND: Array<{ value: HowFound; label: string }> = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'company_site', label: 'Company site' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const CONTACT_METHODS: Array<{ value: PreferredContactMethod; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'phone', label: 'Phone' },
  { value: 'text', label: 'Text' },
];

const RECRUITER_STATUSES: Array<{ value: RecruiterStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'follow_up_needed', label: 'Follow-up needed' },
];

interface Props {
  isOpen: boolean;
  isLoading: boolean;
  applications: Application[];
  scopedApplicationId?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateContactSchemaType) => void;
}

export function ContactModal({
  isOpen,
  isLoading,
  applications,
  scopedApplicationId,
  onClose,
  onSubmit,
}: Props) {
  const [contactType, setContactType] = useState<ContactType>('company_contact');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [outreachStatus, setOutreachStatus] = useState<OutreachStatus | ''>('');
  const [howFound, setHowFound] = useState<HowFound | ''>('');
  const [agency, setAgency] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<PreferredContactMethod | ''>('');
  const [recruiterStatus, setRecruiterStatus] = useState<RecruiterStatus | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContactType('company_contact');
      setFirstName('');
      setLastName('');
      setTitle('');
      setEmail('');
      setLinkedinUrl('');
      setApplicationId(scopedApplicationId ?? '');
      setOutreachStatus('');
      setHowFound('');
      setAgency('');
      setPreferredContactMethod('');
      setRecruiterStatus('');
      setNotes('');
    }
  }, [isOpen, scopedApplicationId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateContactSchemaType = {
      contact_type: contactType,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      title: title.trim() || null,
      email: email.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      application_id: applicationId || null,
      outreach_status: outreachStatus || null,
      how_found: howFound || null,
      agency: agency.trim() || null,
      preferred_contact_method: preferredContactMethod || null,
      recruiter_status: recruiterStatus || null,
      notes: notes.trim() || null,
    };

    onSubmit(payload);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ background: 'var(--soft)', borderColor: 'var(--line)' }}>
            <Dialog.Title className="text-base font-bold" style={{ color: 'var(--ink)' }}>
              Add Contact
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="p-1 rounded hover:bg-black/10 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label>
                  <span className="field-label">Contact Type</span>
                  <select className="field-select" value={contactType} onChange={(event) => setContactType(event.target.value as ContactType)}>
                    {CONTACT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="field-label">First Name *</span>
                  <input className="field-input" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
                </label>
                <label>
                  <span className="field-label">Last Name *</span>
                  <input className="field-input" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label>
                  <span className="field-label">Title</span>
                  <input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} />
                </label>
                <label>
                  <span className="field-label">Email</span>
                  <input type="email" className="field-input" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label>
                  <span className="field-label">LinkedIn</span>
                  <input type="url" className="field-input" placeholder="https://" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} />
                </label>
              </div>

              {contactType === 'company_contact' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label>
                    <span className="field-label">Application</span>
                    <select className="field-select" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} disabled={Boolean(scopedApplicationId)}>
                      <option value="">Not linked</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>{app.company} - {app.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label">Outreach Status</span>
                    <select className="field-select" value={outreachStatus} onChange={(event) => setOutreachStatus(event.target.value as OutreachStatus | '')}>
                      <option value="">Not set</option>
                      {OUTREACH_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="field-label">How Found</span>
                    <select className="field-select" value={howFound} onChange={(event) => setHowFound(event.target.value as HowFound | '')}>
                      <option value="">Not set</option>
                      {HOW_FOUND.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
              )}

              {contactType === 'recruiter' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label>
                    <span className="field-label">Agency</span>
                    <input className="field-input" value={agency} onChange={(event) => setAgency(event.target.value)} />
                  </label>
                  <label>
                    <span className="field-label">Preferred Method</span>
                    <select className="field-select" value={preferredContactMethod} onChange={(event) => setPreferredContactMethod(event.target.value as PreferredContactMethod | '')}>
                      <option value="">Not set</option>
                      {CONTACT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="field-label">Recruiter Status</span>
                    <select className="field-select" value={recruiterStatus} onChange={(event) => setRecruiterStatus(event.target.value as RecruiterStatus | '')}>
                      <option value="">Not set</option>
                      {RECRUITER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </label>
                </div>
              )}

              <label>
                <span className="field-label">Notes</span>
                <textarea className="field-textarea" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className="px-6 py-4 flex justify-end gap-2 border-t bg-gray-50" style={{ borderColor: 'var(--line)' }}>
              <button type="button" onClick={onClose} className="btn-ghost text-sm text-gray-600">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary text-sm px-6">
                {isLoading ? <span className="flex items-center gap-2"><Spinner color="white" /> Saving...</span> : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
