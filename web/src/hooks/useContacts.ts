import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as contactsApi from '@/api/contacts.api';
import type { ContactsListParams } from '@/api/contacts.api';
import type { CreateContactSchemaType, UpdateContactSchemaType } from '@shared/schemas';

export const contactKeys = {
  all: ['contacts'] as const,
  list: (params: ContactsListParams) => ['contacts', 'list', params] as const,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}
