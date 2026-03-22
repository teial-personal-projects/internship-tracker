import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Text,
  Center,
} from '@chakra-ui/react';
import type { Job, JobStatus } from '@shared/types';
import { JobRow } from './JobRow';

interface Props {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onCycleStatus: (id: string, status: JobStatus) => void;
  onMarkApplied: (id: string) => void;
  cyclingId?: string | null;
  applyingId?: string | null;
  deletingId?: string | null;
}

const HEADERS = [
  'Company', 'Title', 'Industry', 'Location',
  'Added', 'Applied', 'Deadline', 'Status',
  'Conference', 'Interview', 'Int. Location',
  'Job Link', 'App Link', 'Pay', 'Notes', 'Actions',
];

export function JobsTable({
  jobs,
  onEdit,
  onDelete,
  onCycleStatus,
  onMarkApplied,
  cyclingId,
  applyingId,
  deletingId,
}: Props) {
  if (jobs.length === 0) {
    return (
      <Center py={16} color="gray.400">
        <Text>No jobs here. Add one to get started!</Text>
      </Center>
    );
  }

  return (
    <Box overflowX="auto" borderRadius="md" border="1px solid" borderColor="gray.200" bg="white">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            {HEADERS.map((h) => (
              <Th
                key={h}
                bg="brand.50"
                color="brand.700"
                fontSize="xs"
                letterSpacing="wide"
                py={3}
                whiteSpace="nowrap"
                borderBottom="2px solid"
                borderColor="brand.200"
              >
                {h}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
              onCycleStatus={onCycleStatus}
              onMarkApplied={onMarkApplied}
              isCycling={cyclingId === job.id}
              isApplying={applyingId === job.id}
              isDeleting={deletingId === job.id}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
