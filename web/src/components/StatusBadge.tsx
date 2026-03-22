import { Badge, Tooltip } from '@chakra-ui/react';
import type { Job, JobStatus } from '@shared/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

interface Props {
  job: Job;
  onCycle: (id: string, currentStatus: JobStatus) => void;
  isLoading?: boolean;
}

export function StatusBadge({ job, onCycle, isLoading }: Props) {
  return (
    <Tooltip label="Click to change status" placement="top" openDelay={500}>
      <Badge
        colorScheme={STATUS_COLORS[job.status] ?? 'gray'}
        borderRadius="full"
        px={2}
        py={0.5}
        fontSize="xs"
        cursor={isLoading ? 'wait' : 'pointer'}
        userSelect="none"
        onClick={() => !isLoading && onCycle(job.id, job.status)}
        _hover={{ opacity: 0.8 }}
        textTransform="none"
        fontWeight="semibold"
      >
        {STATUS_LABELS[job.status] ?? job.status}
      </Badge>
    </Tooltip>
  );
}
