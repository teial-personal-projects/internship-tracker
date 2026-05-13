import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as contactsApi from '@/api/contacts.api';
import type { ContactsListParams } from '@/api/contacts.api';
import type {
  CreateContactInteractionSchemaType,
  CreateContactSchemaType,
  CreateContactTemplateSchemaType,
  UpdateContactSchemaType,
} from '@shared/schemas';

export const contactKeys = {
  all: ['contacts'] as const,
  list: (params: ContactsListParams) => ['contacts', 'list', params] as const,
  detail: (id: string) => ['contacts', 'detail', id] as const,
  interactions: (id: string) => ['contacts', 'interactions', id] as const,
  templates: (id: string) => ['contacts', 'templates', id] as const,
};

export function useContacts(params: ContactsListParams = {}) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsApi.getContacts(params),
    staleTime: 30_000,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContactSchemaType) => contactsApi.createContact(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactSchemaType }) =>
      contactsApi.updateContact(id, data),
    onSuccess: (_contact, variables) => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      qc.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

export function useContactInteractions(id: string | null) {
  return useQuery({
    queryKey: id ? contactKeys.interactions(id) : ['contacts', 'interactions', 'disabled'],
    queryFn: () => contactsApi.getContactInteractions(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateContactInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<CreateContactInteractionSchemaType, 'contact_id'>;
    }) => contactsApi.createContactInteraction(id, data),
    onSuccess: (_interaction, variables) => {
      qc.invalidateQueries({ queryKey: contactKeys.interactions(variables.id) });
      qc.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

export function useContactTemplates(id: string | null) {
  return useQuery({
    queryKey: id ? contactKeys.templates(id) : ['contacts', 'templates', 'disabled'],
    queryFn: () => contactsApi.getContactTemplates(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateContactTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<CreateContactTemplateSchemaType, 'contact_id'>;
    }) => contactsApi.createContactTemplate(id, data),
    onSuccess: (_template, variables) => {
      qc.invalidateQueries({ queryKey: contactKeys.templates(variables.id) });
    },
  });
}
