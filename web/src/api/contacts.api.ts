import { apiClient } from './client';
import type {
  ContactType,
  ContactInteractionType,
  ContactTemplateType,
  CreateContactInteractionSchemaType,
  CreateContactSchemaType,
  CreateContactTemplateSchemaType,
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
  company?: string | null;
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

export interface ContactInteraction {
  id: string;
  user_id: string;
  contact_id: string;
  purpose: ContactInteractionType;
  body?: string | null;
  occurred_at: string;
  created_at: string;
}

export interface ContactTemplate {
  id: string;
  user_id: string;
  contact_id: string;
  name: string;
  template_type?: ContactTemplateType | null;
  body?: string | null;
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

export async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(`/contacts/${id}`);
}

export async function getContactInteractions(id: string): Promise<ContactInteraction[]> {
  const { data } = await apiClient.get<{ data: ContactInteraction[] }>(`/contacts/${id}/interactions`);
  return data.data;
}

export async function createContactInteraction(
  id: string,
  input: Omit<CreateContactInteractionSchemaType, 'contact_id'>,
): Promise<ContactInteraction> {
  const { data } = await apiClient.post<{ data: ContactInteraction }>(`/contacts/${id}/interactions`, input);
  return data.data;
}

export async function getContactTemplates(id: string): Promise<ContactTemplate[]> {
  const { data } = await apiClient.get<{ data: ContactTemplate[] }>(`/contacts/${id}/templates`);
  return data.data;
}

export async function createContactTemplate(
  id: string,
  input: Omit<CreateContactTemplateSchemaType, 'contact_id'>,
): Promise<ContactTemplate> {
  const { data } = await apiClient.post<{ data: ContactTemplate }>(`/contacts/${id}/templates`, input);
  return data.data;
}
