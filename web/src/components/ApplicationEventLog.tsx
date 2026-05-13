import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CalendarClock, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import type { ApplicationEventType, CreateApplicationEventSchemaType } from '@shared/schemas';
import type { ApplicationEvent } from '@/api/applications.api';
import { useApplicationEvents, useCreateApplicationEvent } from '@/hooks/useApplications';
import { Spinner } from './Spinner';

const EVENT_TYPES: ApplicationEventType[] = [
  'status_change',
  'company_reached_out',
  'info_requested',
  'document_submitted',
  'offer_received',
  'interview_scheduled',
  'rejection',
  'note',
];

const EVENT_LABELS: Record<ApplicationEventType, string> = {
  status_change: 'Status change',
  company_reached_out: 'Company reached out',
  info_requested: 'Info requested',
  document_submitted: 'Document submitted',
  offer_received: 'Offer received',
  interview_scheduled: 'Interview scheduled',
  rejection: 'Rejection',
  note: 'Note',
};

function toDatetimeLocal(value: Date): string {
  const offsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoDatetime(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function contactName(event: ApplicationEvent): string | null {
  if (!event.contacts) return null;
  return `${event.contacts.first_name} ${event.contacts.last_name}`.trim();
}

interface Props {
  applicationId: string;
}

export function ApplicationEventLog({ applicationId }: Props) {
  const { data: events = [], isLoading, error } = useApplicationEvents(applicationId);
  const createEvent = useCreateApplicationEvent(applicationId);
  const defaultOccurredAt = useMemo(() => toDatetimeLocal(new Date()), []);
  const [eventType, setEventType] = useState<ApplicationEventType>('note');
  const [body, setBody] = useState('');
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAt);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateApplicationEventSchemaType = {
      event_type: eventType,
      body: body.trim() || null,
      occurred_at: toIsoDatetime(occurredAt),
    };

    try {
      await createEvent.mutateAsync(payload);
      setBody('');
      setEventType('note');
      setOccurredAt(toDatetimeLocal(new Date()));
      toast.success('Event added');
    } catch {
      toast.error('Could not add event');
    }
  }

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Application timeline</h2>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Notes and application-level updates</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-sm" style={{ color: '#B91C1C' }}>Could not load timeline.</p>
        ) : events.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No application events yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l pl-4" style={{ borderColor: 'var(--line)' }}>
            {events.map((event) => {
              const name = contactName(event);
              return (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[23px] top-1 flex h-3 w-3 rounded-full border-2 bg-white"
                    style={{ borderColor: 'var(--accent)' }}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {EVENT_LABELS[event.event_type]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--ink-4)' }}>
                        <CalendarClock size={13} />
                        {formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })}
                      </span>
                    </div>
                    {name && (
                      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{name}</p>
                    )}
                    {event.body && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{event.body}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-4 flex flex-col gap-3" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Add event</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="field-label">Event type</span>
            <select
              className="field-select"
              value={eventType}
              onChange={(event) => setEventType(event.target.value as ApplicationEventType)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{EVENT_LABELS[type]}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Occurred at</span>
            <input
              type="datetime-local"
              className="field-input"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="field-label">Body</span>
          <textarea
            className="field-textarea"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add optional context..."
          />
        </label>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary text-sm px-4 py-2" disabled={createEvent.isPending}>
            {createEvent.isPending ? <span className="flex items-center gap-2"><Spinner color="white" /> Adding...</span> : 'Add event'}
          </button>
        </div>
      </form>
    </section>
  );
}
