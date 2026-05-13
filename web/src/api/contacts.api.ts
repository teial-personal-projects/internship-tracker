import { apiClient } from './client';
import type {
  ContactType,
  CreateContactSchemaType,
  HowFound,
  OutreachStatus,
  PreferredContactMethod,
  RecruiterStatus,
  UpdateContactSchemaType,
} from '@shared/schemas';

export interface Contact {
  id: string;
  user_id: string;
  contact_type: ContactType;
  application_id?: string | null;
  first_name: string;
  last_name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  agency?: string | null;
  preferred_contact_method?: PreferredContactMethod | null;
  how_found?: HowFound | null;
  outreach_status?: OutreachStatus | null;
  recruiter_status?: RecruiterStatus | null;
  notes?: string | null;
  date_of_last_outreach?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactsListParams {
  contact_type?: string;
  application_id?: string;
  outreach_status?: string;
  recruiter_status?: string;
}

export async function getContacts(params: ContactsListParams = {}): Promise<Contact[]> {
  const { data } = await apiClient.get<{ data: Contact[] }>('/contacts', { params });
  return data.data;
}

export async function createContact(input: CreateContactSchemaType): Promise<Contact> {
  const { data } = await apiClient.post<{ data: Contact }>('/contacts', input);
  return data.data;
}

export async function updateContact(id: string, input: UpdateContactSchemaType): Promise<Contact> {
  const { data } = await apiClient.patch<{ data: Contact }>(`/contacts/${id}`, input);
  return data.data;
}
