import { Tr, Td, HStack, Button, IconButton, Link, Text, Tooltip } from '@chakra-ui/react';
import { addDays, isWithinInterval, parseISO, subDays } from 'date-fns';
import type { Job } from '@shared/types';
import { StatusBadge } from './StatusBadge';
import type { JobStatus } from '@shared/types';

interface Props {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onCycleStatus: (id: string, status: JobStatus) => void;
  onMarkApplied: (id: string) => void;
  isCycling: boolean;
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

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  // Avoid timezone shift — parse as local date
  const [year, month, day] = d.split('-');
  return `${month}/${day}/${year?.slice(2)}`;
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function JobRow({ job, onEdit, onDelete, onCycleStatus, onMarkApplied, isCycling, isApplying, isDeleting }: Props) {
  const bg = getRowBg(job);

  return (
    <Tr bg={bg} _hover={{ bg: bg ?? 'gray.50' }} transition="background 0.15s">
      <Td whiteSpace="nowrap" fontSize="sm" fontWeight="medium">
        {job.company}
        {job.min_year && (
          <Text fontSize="xs" color="gray.400" textTransform="capitalize">{job.min_year}</Text>
        )}
      </Td>
      <Td fontSize="sm">{job.title}</Td>
      <Td fontSize="sm" color="gray.600">{job.industry ?? '—'}</Td>
      <Td fontSize="sm" color="gray.600" whiteSpace="nowrap">{job.location ?? '—'}</Td>
      <Td fontSize="sm" whiteSpace="nowrap">{formatDate(job.added)}</Td>
      <Td fontSize="sm" whiteSpace="nowrap">{formatDate(job.applied_date)}</Td>
      <Td fontSize="sm" whiteSpace="nowrap" color={job.deadline ? 'inherit' : 'gray.400'}>
        {formatDate(job.deadline)}
      </Td>
      <Td>
        <StatusBadge job={job} onCycle={onCycleStatus} isLoading={isCycling} />
      </Td>
      <Td fontSize="sm" color="gray.600">{job.conference ?? '—'}</Td>
      <Td fontSize="sm" whiteSpace="nowrap">{formatDateTime(job.interview_date)}</Td>
      <Td fontSize="sm" color="gray.600">{job.interview_location ?? '—'}</Td>
      <Td fontSize="sm">
        {job.job_link ? (
          <Link href={job.job_link} isExternal color="brand.500" fontSize="xs">Job</Link>
        ) : '—'}
      </Td>
      <Td fontSize="sm">
        {job.app_link ? (
          <Link href={job.app_link} isExternal color="brand.500" fontSize="xs">Apply</Link>
        ) : '—'}
      </Td>
      <Td fontSize="sm" color="gray.600">{job.pay ?? '—'}</Td>
      <Td fontSize="sm" maxW="150px">
        {job.notes ? (
          <Tooltip label={job.notes} placement="top">
            <Text noOfLines={1} cursor="default">{job.notes}</Text>
          </Tooltip>
        ) : '—'}
      </Td>
      <Td>
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
              → Applied
            </Button>
          )}
          <IconButton
            aria-label="Delete job"
            icon={<span>×</span>}
            size="xs"
            variant="ghost"
            colorScheme="red"
            isLoading={isDeleting}
            onClick={() => onDelete(job.id)}
          />
        </HStack>
      </Td>
    </Tr>
  );
}
