import type { ApplicationEventType } from '@shared/schemas';

export const EVENT_TYPES: ApplicationEventType[] = [
  'status_change',
  'company_reached_out',
  'info_requested',
  'document_submitted',
  'offer_received',
  'interview_scheduled',
  'rejection',
  'note',
];

export const EVENT_LABELS: Record<ApplicationEventType, string> = {
  status_change: 'Status change',
  company_reached_out: 'Company reached out',
  info_requested: 'Info requested',
  document_submitted: 'Document submitted',
  offer_received: 'Offer received',
  interview_scheduled: 'Interview scheduled',
  rejection: 'Rejection',
  note: 'Note',
};
