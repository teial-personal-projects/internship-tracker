import * as Dialog from '@radix-ui/react-dialog';
import { Check, ClipboardList, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { ApplicationTypeBadge } from '@/components/ApplicationTypeBadge';
import { Spinner } from '@/components/Spinner';
import { useApplications } from '@/hooks/useApplications';
import { useContacts } from '@/hooks/useContacts';
import { useCreateTask, useTasks, useUpdateTask } from '@/hooks/useTasks';
import { formatDate, todayStr } from '@/lib/dateUtils';
import type { Contact } from '@/api/contacts.api';
import type { Task } from '@/api/tasks.api';
import type { Application, TaskCategory, TaskPriority, TaskStatus } from '@shared/schemas';

const CATEGORIES: Array<{ value: TaskCategory; label: string }> = [
  { value: 'application', label: 'Application' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'research', label: 'Research' },
  { value: 'interview_prep', label: 'Interview Prep' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: Array<{ value: TaskPriority; label: string; color: string }> = [
  { value: 'high', label: 'High', color: 'var(--accent)' },
  { value: 'medium', label: 'Medium', color: '#A36410' },
  { value: 'low', label: 'Low', color: 'var(--ink-3)' },
];

const STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'complete', label: 'Done' },
  { value: 'skipped', label: 'Skipped' },
];

type GroupMode = 'company' | 'category' | 'due_date';

const GROUP_MODES: Array<{ value: GroupMode; label: string }> = [
  { value: 'company', label: 'Company' },
  { value: 'category', label: 'Category' },
  { value: 'due_date', label: 'Due Date' },
];

const categoryLabel = (category: string) =>
  CATEGORIES.find((item) => item.value === category)?.label ?? category;

const priorityMeta = (priority: TaskPriority) =>
  PRIORITIES.find((item) => item.value === priority) ?? PRIORITIES[1];

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const today = new Date(`${todayStr()}T00:00:00`);
  const due = new Date(`${date}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function countdownLabel(task: Task): string {
  const days = daysUntil(task.due_date);
  if (days === null) return 'No date';
  if (days < 0) return 'Missed';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

function groupLabel(
  task: Task,
  mode: GroupMode,
  applicationById: Map<string, Application>,
): string {
  if (mode === 'category') return categoryLabel(task.category);
  if (mode === 'due_date') {
    const days = daysUntil(task.due_date);
    if (days === null) return 'No due date';
    if (days < 0) return 'Past due';
    if (days === 0) return 'Due today';
    if (days <= 7) return 'Next 7 days';
    return 'Later';
  }
  return task.application_id ? applicationById.get(task.application_id)?.company ?? 'Unknown company' : 'Unlinked';
}

function groupTasks(
  tasks: Task[],
  mode: GroupMode,
  applicationById: Map<string, Application>,
): Array<[string, Task[]]> {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const label = groupLabel(task, mode, applicationById);
    groups.set(label, [...(groups.get(label) ?? []), task]);
  }
  return [...groups.entries()];
}

interface TaskRowProps {
  task: Task;
  application?: Application;
  contact?: Contact;
  isUpdating: boolean;
  onComplete: (task: Task) => void;
}

function TaskRow({ task, application, contact, isUpdating, onComplete }: TaskRowProps) {
  const priority = priorityMeta(task.priority);
  const days = daysUntil(task.due_date);
  const isPastDue = task.status === 'open' && days !== null && days < 0;

  return (
    <div className="grid grid-cols-[32px_minmax(220px,1.4fr)_130px_minmax(160px,1fr)_110px_110px] items-center gap-3 border-b px-3 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <button
        type="button"
        aria-label="Mark complete"
        disabled={task.status !== 'open' || isUpdating}
        onClick={() => onComplete(task)}
        className="flex h-6 w-6 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: task.status === 'complete' ? 'var(--sage)' : 'var(--line)', background: task.status === 'complete' ? 'var(--sage)' : 'white' }}
      >
        {task.status === 'complete' && <Check size={14} color="white" />}
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: priority.color }} />
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{task.title}</p>
        </div>
        <p className="mt-1 truncate text-xs" style={{ color: 'var(--ink-3)' }}>
          {contact ? `${contact.first_name} ${contact.last_name}` : task.is_auto_generated ? 'Auto-generated' : 'Manual'}
        </p>
      </div>

      <span className="w-fit rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}>
        {categoryLabel(task.category)}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
          {application?.company ?? 'Unlinked'}
        </p>
        {application?.application_type && (
          <div className="mt-1">
            <ApplicationTypeBadge type={application.application_type} />
          </div>
        )}
      </div>

      <span className="text-sm" style={{ color: 'var(--ink-2)' }}>
        {formatDate(task.due_date)}
      </span>

      <span
        className="w-fit rounded px-2 py-1 text-xs font-bold"
        style={{
          background: isPastDue ? '#FEF2F2' : 'var(--soft)',
          color: isPastDue ? '#B91C1C' : 'var(--ink-2)',
        }}
      >
        {countdownLabel(task)}
      </span>
    </div>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  groupMode: GroupMode;
  applicationById: Map<string, Application>;
  contactById: Map<string, Contact>;
  updatingId: string | null;
  onComplete: (task: Task) => void;
}

function TaskSection({
  title,
  tasks,
  groupMode,
  applicationById,
  contactById,
  updatingId,
  onComplete,
}: TaskSectionProps) {
  return (
    <section className="rounded-lg border bg-white" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>
        <span className="text-xs font-semibold" style={{ color: 'var(--ink-3)' }}>{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--ink-3)' }}>No tasks in this section.</p>
      ) : (
        groupTasks(tasks, groupMode, applicationById).map(([group, groupTasksList]) => (
          <div key={group}>
            <div className="bg-[var(--soft)] px-3 py-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-3)' }}>
              {group}
            </div>
            {groupTasksList.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                application={task.application_id ? applicationById.get(task.application_id) : undefined}
                contact={task.contact_id ? contactById.get(task.contact_id) : undefined}
                isUpdating={updatingId === task.id}
                onComplete={onComplete}
              />
            ))}
          </div>
        ))
      )}
    </section>
  );
}

interface TaskModalProps {
  isOpen: boolean;
  isLoading: boolean;
  applications: Application[];
  contacts: Contact[];
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    application_id: string | null;
    contact_id: string | null;
    notes: string | null;
    is_auto_generated: boolean;
  }) => void;
}

function TaskModal({ isOpen, isLoading, applications, contacts, onClose, onSubmit }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('application');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [contactId, setContactId] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      category,
      priority,
      status: 'open',
      due_date: dueDate || null,
      application_id: applicationId || null,
      contact_id: contactId || null,
      notes: notes.trim() || null,
      is_auto_generated: false,
    });
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ background: 'var(--soft)', borderColor: 'var(--line)' }}>
            <Dialog.Title className="text-base font-bold" style={{ color: 'var(--ink)' }}>Add Task</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="rounded p-1 hover:bg-black/10">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="field-label">Title</span>
                <input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>

              <label>
                <span className="field-label">Category</span>
                <select className="field-select" value={category} onChange={(event) => setCategory(event.target.value as TaskCategory)}>
                  {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label>
                <span className="field-label">Priority</span>
                <select className="field-select" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                  {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label>
                <span className="field-label">Due Date</span>
                <input type="date" className="field-input" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>

              <label>
                <span className="field-label">Application</span>
                <select className="field-select" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
                  <option value="">Unlinked</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>{application.company} - {application.title}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label">Contact</span>
                <select className="field-select" value={contactId} onChange={(event) => setContactId(event.target.value)}>
                  <option value="">Unlinked</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.first_name} {contact.last_name}</option>
                  ))}
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="field-label">Notes</span>
                <textarea className="field-textarea min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: 'var(--line)' }}>
              <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ActionItemsPage() {
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupMode, setGroupMode] = useState<GroupMode>('company');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const taskParams = useMemo(() => ({
    ...(category && { category }),
    ...(priority && { priority }),
    ...(status && { status }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  }), [category, priority, status, dateFrom, dateTo]);

  const { data: tasks = [], isLoading, error } = useTasks(taskParams);
  const { data: applicationsData } = useApplications({ limit: 100 });
  const { data: contacts = [] } = useContacts();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const applications = applicationsData?.data ?? [];

  const applicationById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  );
  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );

  const openTasks = tasks.filter((task) => task.status === 'open');
  const doneTasks = tasks.filter((task) => task.status === 'complete' || task.status === 'skipped');

  async function handleComplete(task: Task) {
    setUpdatingId(task.id);
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: 'complete' } });
      toast.success('Task completed');
    } catch {
      toast.error('Could not update task');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateTask(input: Parameters<TaskModalProps['onSubmit']>[0]) {
    try {
      await createTask.mutateAsync(input);
      toast.success('Task added');
      setIsModalOpen(false);
    } catch {
      toast.error('Could not add task');
    }
  }

  function clearDateFilters() {
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 pb-20 md:p-4 md:pb-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Action Items</h1>
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Follow-ups, research, and application tasks.</p>
            </div>
            <button type="button" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              Add Task
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3" style={{ borderColor: 'var(--line)' }}>
            <select className="field-select h-9 w-auto min-w-36 py-1 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select className="field-select h-9 w-auto min-w-32 py-1 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="">All Priorities</option>
              {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select className="field-select h-9 w-auto min-w-28 py-1 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input type="date" className="field-input h-9 w-auto py-1 text-sm" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <span className="text-sm" style={{ color: 'var(--ink-4)' }}>to</span>
            <input type="date" className="field-input h-9 w-auto py-1 text-sm" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            {(dateFrom || dateTo) && (
              <button type="button" className="btn-ghost px-3 py-1.5 text-sm" onClick={clearDateFilters}>Clear dates</button>
            )}
            <div className="ml-auto flex items-center gap-1 rounded-lg border bg-white p-1" style={{ borderColor: 'var(--line)' }}>
              {GROUP_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className="rounded px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: groupMode === mode.value ? 'var(--accent-soft)' : 'transparent',
                    color: groupMode === mode.value ? 'var(--accent-dark)' : 'var(--ink-3)',
                  }}
                  onClick={() => setGroupMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border p-3 text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}>
              Failed to load action items.
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-white px-6 py-16 text-center" style={{ borderColor: 'var(--line)' }}>
              <ClipboardList size={30} strokeWidth={1.5} style={{ color: 'var(--ink-3)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>No action items</h2>
              <p className="max-w-sm text-sm" style={{ color: 'var(--ink-3)' }}>Tasks created by application activity or added manually will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-x-auto">
              <TaskSection
                title="Open"
                tasks={openTasks}
                groupMode={groupMode}
                applicationById={applicationById}
                contactById={contactById}
                updatingId={updatingId}
                onComplete={handleComplete}
              />
              <TaskSection
                title="Done"
                tasks={doneTasks}
                groupMode={groupMode}
                applicationById={applicationById}
                contactById={contactById}
                updatingId={updatingId}
                onComplete={handleComplete}
              />
            </div>
          )}
        </div>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        isLoading={createTask.isPending}
        applications={applications}
        contacts={contacts}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
