import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Job } from '@shared/types';
import { MIN_YEAR_OPTIONS, STATUS_CYCLE } from '@shared/types';
import { STATUS_LABELS } from '@/theme';

type FormValues = Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<FormValues>;
  title?: string;
}

const TODAY = new Date().toISOString().split('T')[0];

export function JobModal({ isOpen, onClose, onSubmit, isLoading, defaultValues, title = 'Add Job' }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      added: TODAY,
      status: 'not_started',
      ...defaultValues,
    } as Partial<FormValues>,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        added: TODAY,
        status: 'not_started',
        ...defaultValues,
      } as Partial<FormValues>);
    }
  }, [isOpen, defaultValues]);

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="brand.700">{title}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack spacing={4}>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired isInvalid={!!errors.company}>
                  <FormLabel fontSize="sm">Company</FormLabel>
                  <Input {...register('company', { required: 'Required' })} focusBorderColor="brand.500" size="sm" />
                  <FormErrorMessage>{errors.company?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.title}>
                  <FormLabel fontSize="sm">Title</FormLabel>
                  <Input {...register('title', { required: 'Required' })} focusBorderColor="brand.500" size="sm" />
                  <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Industry</FormLabel>
                  <Input {...register('industry')} focusBorderColor="brand.500" size="sm" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Location</FormLabel>
                  <Input {...register('location')} focusBorderColor="brand.500" size="sm" />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Status</FormLabel>
                  <Select {...register('status')} focusBorderColor="brand.500" size="sm">
                    {STATUS_CYCLE.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Min Year</FormLabel>
                  <Select {...register('min_year')} focusBorderColor="brand.500" size="sm">
                    <option value="">Any</option>
                    {MIN_YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={3} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Added</FormLabel>
                  <Input type="date" {...register('added')} focusBorderColor="brand.500" size="sm" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Deadline</FormLabel>
                  <Input type="date" {...register('deadline')} focusBorderColor="brand.500" size="sm" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Applied Date</FormLabel>
                  <Input type="date" {...register('applied_date')} focusBorderColor="brand.500" size="sm" />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Job Link</FormLabel>
                  <Input type="url" {...register('job_link')} focusBorderColor="brand.500" size="sm" placeholder="https://" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Application Link</FormLabel>
                  <Input type="url" {...register('app_link')} focusBorderColor="brand.500" size="sm" placeholder="https://" />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Conference</FormLabel>
                  <Input {...register('conference')} focusBorderColor="brand.500" size="sm" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Pay</FormLabel>
                  <Input {...register('pay')} focusBorderColor="brand.500" size="sm" placeholder="e.g. $25/hr" />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm">Cover Letter</FormLabel>
                <Input type="url" {...register('cover_letter')} focusBorderColor="brand.500" size="sm" placeholder="https://" />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Notes</FormLabel>
                <Textarea {...register('notes')} focusBorderColor="brand.500" size="sm" rows={3} />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={handleClose} size="sm">Cancel</Button>
            <Button type="submit" colorScheme="brand" isLoading={isLoading} size="sm">
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
