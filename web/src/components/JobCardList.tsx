import { useRef } from 'react';
import {
  Box, Button, HStack, IconButton, Link, Stack, Text,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure,
} from '@chakra-ui/react';
import { addDays, isWithinInterval, parseISO, subDays } from 'date-fns';
import type { Job } from '@shared/types';
import { StatusBadge } from './StatusBadge';

interface ListProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  applyingId: string | null;
  deletingId: string | null;
}

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  const [year, month, day] = d.split('-');
  return `${month}/${day}/${year?.slice(2)}`;
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function getCardBorderColor(job: Job): string {
  if (['applied', 'archive'].includes(job.status)) return 'gray.200';
  const today = new Date();
  const isDue = job.deadline != null && isWithinInterval(parseISO(job.deadline), {
    start: today,
    end: addDays(today, 3),
  });
  const isStale = ['not_started', 'in_progress'].includes(job.status) && parseISO(job.added) <= subDays(today, 7);
  if (isDue) return 'orange.300';
  if (isStale) return 'yellow.300';
  return 'gray.200';
}

function JobCard({ job, onEdit, onDelete, onMarkApplied, isApplying, isDeleting }: {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  isApplying: boolean;
  isDeleting: boolean;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const borderColor = getCardBorderColor(job);

  const jobUrl = safeUrl(job.job_link);
  const appUrl = safeUrl(job.app_link);
  const clUrl = safeUrl(job.cover_letter);
  const canMarkApplied = !['applied', 'archive'].includes(job.status);

  return (
    <>
      <Box
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        p={4}
        boxShadow="sm"
      >
        {/* Top row: company + status badge */}
        <HStack justify="space-between" align="flex-start" mb={1}>
          <Box>
            <Text fontWeight="bold" fontSize="md" color="gray.800" lineHeight="tight">{job.company}</Text>
            <Text fontSize="sm" color="gray.500">{job.title}</Text>
          </Box>
          <StatusBadge job={job} />
        </HStack>

        {/* Meta row: location, dates */}
        <HStack spacing={3} wrap="wrap" mt={2} mb={3}>
          {job.location && (
            <HStack spacing={1}>
              <Text fontSize="xs">📍</Text>
              <Text fontSize="xs" color="gray.600">{job.location}</Text>
            </HStack>
          )}
          {job.added && (
            <Text fontSize="xs" color="gray.500">Added {formatDate(job.added)}</Text>
          )}
          {job.deadline && (
            <Text fontSize="xs" color="orange.500" fontWeight="medium">Due {formatDate(job.deadline)}</Text>
          )}
          {job.applied_date && (
            <Text fontSize="xs" color="brand.600" fontWeight="medium">Applied {formatDate(job.applied_date)}</Text>
          )}
          {job.pay && (
            <Text fontSize="xs" color="gray.500">{job.pay}</Text>
          )}
        </HStack>

        {/* Links row */}
        {(jobUrl || appUrl || clUrl) && (
          <HStack spacing={3} mb={3}>
            {jobUrl && <Link href={jobUrl} isExternal fontSize="xs" color="brand.600" fontWeight="medium">Job Posting ↗</Link>}
            {appUrl && <Link href={appUrl} isExternal fontSize="xs" color="brand.600" fontWeight="medium">Apply ↗</Link>}
            {clUrl && <Link href={clUrl} isExternal fontSize="xs" color="brand.600" fontWeight="medium">Cover Letter ↗</Link>}
          </HStack>
        )}

        {/* Notes */}
        {job.notes && (
          <Text fontSize="xs" color="gray.500" noOfLines={2} mb={3}>{job.notes}</Text>
        )}

        {/* Action buttons */}
        <HStack spacing={2} mt={1}>
          {canMarkApplied && (
            <Button
              size="sm"
              colorScheme="brand"
              variant="outline"
              isLoading={isApplying}
              onClick={() => onMarkApplied(job.id)}
              flex={1}
            >
              ✓ Mark Applied
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            colorScheme="gray"
            onClick={() => onEdit(job)}
            flex={1}
          >
            Edit
          </Button>
          <IconButton
            aria-label="Delete job"
            icon={<TrashIcon />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            isLoading={isDeleting}
            onClick={onOpen}
          />
        </HStack>
      </Box>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="md" fontWeight="bold">Delete Job</AlertDialogHeader>
            <AlertDialogBody fontSize="sm">
              Delete <strong>{job.company}</strong> — {job.title}? This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button size="sm" colorScheme="red" isLoading={isDeleting}
                onClick={() => { onClose(); onDelete(job.id); }}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export function JobCardList({ jobs, onEdit, onDelete, onMarkApplied, applyingId, deletingId }: ListProps) {
  if (jobs.length === 0) {
    return (
      <Box textAlign="center" py={12} color="gray.400">
        <Text>No jobs here.</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkApplied={onMarkApplied}
          isApplying={applyingId === job.id}
          isDeleting={deletingId === job.id}
        />
      ))}
    </Stack>
  );
}
