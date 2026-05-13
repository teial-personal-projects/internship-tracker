import { AppHeader } from '@/components/AppHeader';
import { ApplicationEventLog } from '@/components/ApplicationEventLog';
import { ApplicationTypeBadge } from '@/components/ApplicationTypeBadge';
import { ContactDetailPanel } from '@/components/ContactDetailPanel';
import { ContactModal } from '@/components/ContactModal';
import { ContactsList } from '@/components/ContactsList';
import { Spinner } from '@/components/Spinner';
import { useApplication, useApplicationContacts, useApplications } from '@/hooks/useApplications';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import type { Contact } from '@/api/contacts.api';
import type { ApplicationContactLink } from '@/api/applications.api';
import {
  CHECKLIST_TOTAL,
  checklistDoneCount,
  checklistProgressColor,
  checklistProgressPercent,
} from '@/lib/checklistProgress';
import { OUTREACH_LABELS, RECRUITER_LABELS, contactName } from '@/lib/contactDisplay';
import type { Application, CreateContactSchemaType } from '@shared/schemas';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export function ContactsPage() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('application_id');
  const { data: application, isLoading, error } = useApplication(applicationId);
  const [contactTypeFilter, setContactTypeFilter] = useState('');
  const [outreachFilter, setOutreachFilter] = useState('');
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  const contactParams = useMemo(() => ({
    ...(applicationId && { application_id: applicationId }),
    ...(contactTypeFilter && { contact_type: contactTypeFilter }),
    ...(outreachFilter && { outreach_status: outreachFilter }),
    ...(recruiterFilter && { recruiter_status: recruiterFilter }),
  }), [applicationId, contactTypeFilter, outreachFilter, recruiterFilter]);

  const { data: contacts = [], isLoading: contactsLoading, error: contactsError } = useContacts(contactParams);
  const { data: linkedRecruiters = [], isLoading: linkedRecruitersLoading, error: linkedRecruitersError } = useApplicationContacts(applicationId);
  const { data: applicationsData } = useApplications({ limit: 100 });
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const applications = applicationsData?.data ?? [];

  const applicationById = useMemo(
    () => new Map(applications.map((item) => [item.id, item])),
    [applications],
  );

  const visibleContacts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = contacts.filter((contact) => {
      if (!needle) return true;
      const app = contact.application_id ? applicationById.get(contact.application_id) : undefined;
      return [
        contactName(contact),
        contact.title,
        contact.agency,
        app?.company,
      ].some((value) => value?.toLowerCase().includes(needle));
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === 'status') {
        const leftStatus = left.contact_type === 'recruiter' ? left.recruiter_status : left.outreach_status;
        const rightStatus = right.contact_type === 'recruiter' ? right.recruiter_status : right.outreach_status;
        return (leftStatus ?? '').localeCompare(rightStatus ?? '');
      }
      if (sortBy === 'company') {
        const leftCompany = left.application_id ? applicationById.get(left.application_id)?.company ?? '' : '';
        const rightCompany = right.application_id ? applicationById.get(right.application_id)?.company ?? '' : '';
        return leftCompany.localeCompare(rightCompany);
      }
      if (sortBy === 'date_of_last_outreach') {
        return (right.date_of_last_outreach ?? '').localeCompare(left.date_of_last_outreach ?? '');
      }
      return (right.created_at ?? '').localeCompare(left.created_at ?? '');
    });
  }, [applicationById, contacts, search, sortBy]);

  async function handleSubmitContact(input: CreateContactSchemaType) {
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, data: input });
        toast.success('Contact updated');
      } else {
        await createContact.mutateAsync(input);
        toast.success('Contact added');
      }
      setEditingContact(null);
      setIsModalOpen(false);
    } catch {
      toast.error(editingContact ? 'Could not update contact' : 'Could not add contact');
    }
  }

  async function handleDeleteContact(id: string) {
    setDeletingContactId(id);
    try {
      await deleteContact.mutateAsync(id);
      if (selectedContactId === id) setSelectedContactId(null);
      toast.success('Contact deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingContactId(null);
    }
  }

  function handleEditContact(contact: Contact) {
    setEditingContact(contact);
    setIsModalOpen(true);
  }

  function handleOpenAddModal() {
    setEditingContact(null);
    setIsModalOpen(true);
  }

  if (applicationId) {
    return (
      <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
            <Link
              to="/applications"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--ink-3)' }}
            >
              <ArrowLeft size={16} />
              Applications
            </Link>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : error || !application ? (
              <div className="rounded-xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
                <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Application not found</h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>
                  Return to Applications and choose another record.
                </p>
              </div>
            ) : (
              <>
                <section className="rounded-xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
                        {application.company}
                      </h1>
                      <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{application.title}</p>
                    </div>
                    <ApplicationTypeBadge type={application.application_type} />
                  </div>
                  <ChecklistProgress application={application} />
                </section>

                <section className="rounded-xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Linked contacts</h2>
                      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Contacts scoped to this application</p>
                    </div>
                    <button type="button" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2" onClick={handleOpenAddModal}>
                      <Plus size={16} />
                      Add Contact
                    </button>
                  </div>
                  <ContactsList
                    contacts={visibleContacts}
                    applicationById={applicationById}
                    isLoading={contactsLoading}
                    error={contactsError}
                    selectedContactId={selectedContactId}
                    onSelectContact={(contact) => setSelectedContactId((current) => current === contact.id ? null : contact.id)}
                    showQuickAction
                    onEdit={handleEditContact}
                    onDelete={handleDeleteContact}
                    deletingContactId={deletingContactId}
                    renderDetail={(contact) => (
                      <ContactDetailPanel
                        contact={contact}
                        application={contact.application_id ? applicationById.get(contact.application_id) : undefined}
                      />
                    )}
                  />
                </section>

                <LinkedRecruitersSection
                  links={linkedRecruiters}
                  isLoading={linkedRecruitersLoading}
                  error={linkedRecruitersError}
                />

                <ApplicationEventLog applicationId={application.id} />
              </>
            )}
          </div>
        </main>
        <ContactModal
          isOpen={isModalOpen}
          isLoading={createContact.isPending || updateContact.isPending}
          applications={applications}
          scopedApplicationId={applicationId}
          initialContact={editingContact}
          onClose={() => { setIsModalOpen(false); setEditingContact(null); }}
          onSubmit={handleSubmitContact}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 md:pb-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Contacts</h1>
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
                Company contacts and recruiters across your applications.
              </p>
            </div>
            <button type="button" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2" onClick={handleOpenAddModal}>
              <Plus size={16} />
              Add Contact
            </button>
          </div>

          <section className="rounded-xl border bg-white p-3 sm:p-4" style={{ borderColor: 'var(--line)' }}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
                  <input
                    className="field-input pl-9"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by contact or company..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ['', 'All'],
                    ['company_contact', 'Company'],
                    ['recruiter', 'Recruiter'],
                  ].map(([value, label]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setContactTypeFilter(value)}
                      className="rounded-lg border px-3 py-2 text-sm font-medium"
                      style={{
                        borderColor: contactTypeFilter === value ? 'var(--accent)' : 'var(--line)',
                        background: contactTypeFilter === value ? 'var(--accent-soft)' : 'white',
                        color: contactTypeFilter === value ? 'var(--accent-dark)' : 'var(--ink-2)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select className="field-select" value={outreachFilter} onChange={(event) => setOutreachFilter(event.target.value)}>
                  <option value="">All outreach statuses</option>
                  {Object.entries(OUTREACH_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select className="field-select" value={recruiterFilter} onChange={(event) => setRecruiterFilter(event.target.value)}>
                  <option value="">All recruiter statuses</option>
                  {Object.entries(RECRUITER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select className="field-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="created_at">Sort by date added</option>
                  <option value="status">Sort by status</option>
                  <option value="company">Sort by company</option>
                  <option value="date_of_last_outreach">Sort by last outreach</option>
                </select>
              </div>
            </div>
          </section>

          <ContactsList
            contacts={visibleContacts}
            applicationById={applicationById}
            isLoading={contactsLoading}
            error={contactsError}
            selectedContactId={selectedContactId}
            onSelectContact={(contact) => setSelectedContactId((current) => current === contact.id ? null : contact.id)}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
            deletingContactId={deletingContactId}
            renderDetail={(contact) => (
              <ContactDetailPanel
                contact={contact}
                application={contact.application_id ? applicationById.get(contact.application_id) : undefined}
              />
            )}
          />
        </div>
      </main>

      <ContactModal
        isOpen={isModalOpen}
        isLoading={createContact.isPending || updateContact.isPending}
        applications={applications}
        scopedApplicationId={applicationId}
        initialContact={editingContact}
        onClose={() => { setIsModalOpen(false); setEditingContact(null); }}
        onSubmit={handleSubmitContact}
      />
    </div>
  );
}

function ChecklistProgress({ application }: { application: Application }) {
  const done = checklistDoneCount(application);
  const percent = checklistProgressPercent(application);
  const color = checklistProgressColor(done);

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color }}>
          Checklist: {done}/{CHECKLIST_TOTAL}
        </span>
        <span className="text-xs" style={{ color: 'var(--ink-4)' }}>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--soft)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  );
}

function LinkedRecruitersSection({
  links,
  isLoading,
  error,
}: {
  links: ApplicationContactLink[];
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <section className="rounded-xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
      <div className="mb-4">
        <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Linked recruiters</h2>
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Recruiter contacts linked through this application</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#FECACA' }}>
          <p className="text-sm" style={{ color: '#B91C1C' }}>Could not load linked recruiters.</p>
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No linked recruiters yet.</p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
          {links.map((link) => link.contacts && (
            <LinkedRecruiterRow key={link.id} recruiter={link.contacts} />
          ))}
        </div>
      )}
    </section>
  );
}

function LinkedRecruiterRow({ recruiter }: { recruiter: Contact }) {
  const status = recruiter.recruiter_status ? RECRUITER_LABELS[recruiter.recruiter_status] : 'Not set';

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{contactName(recruiter)}</p>
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          {recruiter.agency || recruiter.email || recruiter.preferred_contact_method || 'Recruiter'}
        </p>
      </div>
      <span
        className="inline-flex w-fit items-center rounded px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}
      >
        {status}
      </span>
    </div>
  );
}
