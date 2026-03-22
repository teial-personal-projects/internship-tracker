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
  Divider,
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


const labelProps = {
  fontSize: 'xs' as const,
  fontWeight: 'semibold' as const,
  color: 'brand.700',
  textTransform: 'uppercase' as const,
  letterSpacing: 'wider' as const,
  mb: 1,
};

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
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent borderRadius="xl" overflow="hidden" border="1px solid" borderColor="brand.100">
        <ModalHeader
          bg="brand.50"
          borderBottom="2px solid"
          borderColor="brand.200"
          color="brand.800"
          fontSize="lg"
          fontWeight="bold"
          py={4}
          px={6}
        >
          {title}
        </ModalHeader>
        <ModalCloseButton top={3} color="brand.600" />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody px={6} py={5} bg="white" overflowY="auto" maxH="70vh">
            <Stack spacing={5} divider={<Divider borderColor="brand.100" my={-1} />}>

              {/* Row 1: Company + Title */}
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired isInvalid={!!errors.company}>
                  <FormLabel {...labelProps}>Company</FormLabel>
                  <Input {...register('company', { required: 'Required' })} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                  <FormErrorMessage>{errors.company?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.title}>
                  <FormLabel {...labelProps}>Title</FormLabel>
                  <Input {...register('title', { required: 'Required' })} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                  <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {/* Row 2: Industry + Location + Pay */}
              <SimpleGrid columns={3} spacing={4}>
                <FormControl>
                  <FormLabel {...labelProps}>Industry</FormLabel>
                  <Input {...register('industry')} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelProps}>Location</FormLabel>
                  <Input {...register('location')} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelProps}>Pay</FormLabel>
                  <Input {...register('pay')} focusBorderColor="brand.500" size="sm" borderRadius="md" placeholder="e.g. $25/hr" />
                </FormControl>
              </SimpleGrid>

              {/* Row 3: Status + Min Year */}
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel {...labelProps}>Status</FormLabel>
                  <Select {...register('status')} focusBorderColor="brand.500" size="sm" borderRadius="md">
                    {STATUS_CYCLE.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel {...labelProps}>Min Year</FormLabel>
                  <Select {...register('min_year')} focusBorderColor="brand.500" size="sm" borderRadius="md">
                    <option value="">Any</option>
                    {MIN_YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              {/* Row 4: Dates */}
              <SimpleGrid columns={3} spacing={4}>
                <FormControl>
                  <FormLabel {...labelProps}>Added</FormLabel>
                  <Input type="date" {...register('added')} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelProps}>Deadline</FormLabel>
                  <Input type="date" {...register('deadline')} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelProps}>Applied Date</FormLabel>
                  <Input type="date" {...register('applied_date')} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                </FormControl>
              </SimpleGrid>

              {/* Row 5: Links */}
              <Stack spacing={3}>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel {...labelProps}>Job Link</FormLabel>
                    <Input type="url" {...register('job_link')} focusBorderColor="brand.500" size="sm" borderRadius="md" placeholder="https://" />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelProps}>Application Link</FormLabel>
                    <Input type="url" {...register('app_link')} focusBorderColor="brand.500" size="sm" borderRadius="md" placeholder="https://" />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel {...labelProps}>Cover Letter</FormLabel>
                  <Input type="url" {...register('cover_letter')} focusBorderColor="brand.500" size="sm" borderRadius="md" placeholder="https://" />
                </FormControl>
              </Stack>

              {/* Row 6: Conference + Notes */}
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel {...labelProps}>Conference</FormLabel>
                  <Input {...register('conference')} focusBorderColor="brand.500" size="sm" borderRadius="md" />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelProps}>Notes</FormLabel>
                  <Textarea {...register('notes')} focusBorderColor="brand.500" size="sm" borderRadius="md" rows={3} />
                </FormControl>
              </Stack>

            </Stack>
          </ModalBody>
          <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.200" gap={2} px={6} py={4}>
            <Button variant="ghost" onClick={handleClose} size="sm" color="gray.600">Cancel</Button>
            <Button type="submit" colorScheme="brand" isLoading={isLoading} size="sm" px={6}>
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
