import { useRef } from 'react';
import {
  Tr, Td, HStack, Button, IconButton, Link, Text, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure,
} from '@chakra-ui/react';
import { addDays, isWithinInterval, parseISO, subDays } from 'date-fns';
import type { Job } from '@shared/types';
import { StatusBadge } from './StatusBadge';
export type ColKey =
  | 'company' | 'title' | 'industry' | 'location'
  | 'added' | 'applied' | 'deadline' | 'status'
  | 'conference'
  | 'job_link' | 'app_link' | 'cover_letter' | 'pay' | 'notes' | 'actions';

interface Props {
  job: Job;
  colOrder: ColKey[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  isApplying: boolean;
  isDeleting: boolean;
}

function getRowBg(job: Job): string | undefined {
  if (['applied', 'archive'].includes(job.status)) return undefined;
  const today = new Date();
  const isDue =
    job.deadline != null &&
    isWithinInterval(parseISO(job.deadline), {
      start: today,
      end: addDays(today, 3),
    });
  const isStale =
    ['not_started', 'in_progress'].includes(job.status) &&
    parseISO(job.added) <= subDays(today, 7);

  if (isDue) return 'dueSoon.50';
  if (isStale) return 'stale.50';
  return undefined;
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
  if (!d) return '—';
  const [year, month, day] = d.split('-');
  return `${month}/${day}/${year?.slice(2)}`;
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function JobRow({
  job,
  colOrder,
  onEdit,
  onDelete,
  onMarkApplied,
  isApplying,
  isDeleting,
}: Props) {
  const bg = getRowBg(job);
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  function renderCell(key: ColKey) {
    switch (key) {
      case 'company':
        return (
          <Td key={key} whiteSpace="nowrap" fontSize="sm" fontWeight="medium">
            {job.company}
            {job.min_year && (
              <Text fontSize="xs" color="gray.400" textTransform="capitalize">{job.min_year}</Text>
            )}
          </Td>
        );
      case 'title':
        return <Td key={key} fontSize="sm">{job.title}</Td>;
      case 'industry':
        return <Td key={key} fontSize="sm" color="gray.600">{job.industry ?? '—'}</Td>;
      case 'location':
        return <Td key={key} fontSize="sm" color="gray.600" whiteSpace="nowrap">{job.location ?? '—'}</Td>;
      case 'added':
        return <Td key={key} fontSize="sm" whiteSpace="nowrap">{formatDate(job.added)}</Td>;
      case 'applied':
        return <Td key={key} fontSize="sm" whiteSpace="nowrap">{formatDate(job.applied_date)}</Td>;
      case 'deadline':
        return (
          <Td key={key} fontSize="sm" whiteSpace="nowrap" color={job.deadline ? 'inherit' : 'gray.400'}>
            {formatDate(job.deadline)}
          </Td>
        );
      case 'status':
        return (
          <Td key={key}>
            <StatusBadge job={job} />
          </Td>
        );
      case 'conference':
        return <Td key={key} fontSize="sm" color="gray.600">{job.conference ?? '—'}</Td>;
      case 'job_link': {
        const url = safeUrl(job.job_link);
        return (
          <Td key={key} fontSize="sm">
            {url ? <Link href={url} isExternal color="brand.500" fontSize="xs">Job</Link> : '—'}
          </Td>
        );
      }
      case 'app_link': {
        const url = safeUrl(job.app_link);
        return (
          <Td key={key} fontSize="sm">
            {url ? <Link href={url} isExternal color="brand.500" fontSize="xs">Apply</Link> : '—'}
          </Td>
        );
      }
      case 'cover_letter': {
        const url = safeUrl(job.cover_letter);
        return (
          <Td key={key} fontSize="sm">
            {url ? <Link href={url} isExternal color="brand.500" fontSize="xs">Cover Letter</Link> : '—'}
          </Td>
        );
      }
      case 'pay':
        return <Td key={key} fontSize="sm" color="gray.600">{job.pay ?? '—'}</Td>;
      case 'notes':
        return (
          <Td key={key} fontSize="sm" maxW="150px">
            {job.notes ? (
              <Tooltip label={job.notes} placement="top">
                <Text noOfLines={1} cursor="default">{job.notes}</Text>
              </Tooltip>
            ) : '—'}
          </Td>
        );
      case 'actions':
        return (
          <Td key={key} position="sticky" right={0} bg={bg ?? 'white'} boxShadow="-2px 0 6px rgba(0,0,0,0.06)" zIndex={1}>
            <HStack spacing={1} justify="flex-end">
              <Button size="xs" variant="outline" colorScheme="brand" onClick={() => onEdit(job)}>
                Edit
              </Button>
              {!['applied', 'archive'].includes(job.status) && (
                <Button
                  size="xs"
                  colorScheme="cyan"
                  isLoading={isApplying}
                  onClick={() => onMarkApplied(job.id)}
                >
                  Mark Applied
                </Button>
              )}
              <IconButton
                aria-label="Delete job"
                icon={<TrashIcon />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                isLoading={isDeleting}
                onClick={onConfirmOpen}
              />
            </HStack>
          </Td>
        );
    }
  }

  return (
    <>
      <Tr bg={bg} _hover={{ bg: bg ?? 'gray.50' }} transition="background 0.15s">
        {colOrder.map(key => renderCell(key))}
      </Tr>

      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="md" fontWeight="bold">Delete Job</AlertDialogHeader>
            <AlertDialogBody fontSize="sm">
              Delete <strong>{job.company}</strong>{job.title !== 'N/A' ? ` — ${job.title}` : ''}? This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} size="sm" variant="ghost" onClick={onConfirmClose}>Cancel</Button>
              <Button
                size="sm"
                colorScheme="red"
                isLoading={isDeleting}
                onClick={() => { onConfirmClose(); onDelete(job.id); }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
