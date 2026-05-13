import type { Contact } from '@/api/contacts.api';

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  company_contact: 'Company',
  recruiter: 'Recruiter',
  other: 'Other',
};

export const OUTREACH_LABELS: Record<string, string> = {
  not_contacted: 'Not contacted',
  applied_msg_sent: 'Applied message sent',
  double_down_sent: 'Double-down sent',
  follow_up_sent: 'Follow-up sent',
  replied: 'Replied',
  no_response: 'No response',
};

export const RECRUITER_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  follow_up_needed: 'Follow-up needed',
};

export function contactName(contact: Contact): string {
  return `${contact.first_name} ${contact.last_name}`.trim();
}
