import { Badge } from '@chakra-ui/react';
import type { Job } from '@shared/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

interface Props {
  job: Job;
}

export function StatusBadge({ job }: Props) {
  return (
    <Badge
      colorScheme={STATUS_COLORS[job.status] ?? 'gray'}
      borderRadius="full"
      px={2}
      py={0.5}
      fontSize="xs"
      textTransform="none"
      fontWeight="semibold"
    >
      {STATUS_LABELS[job.status] ?? job.status}
    </Badge>
  );
}
