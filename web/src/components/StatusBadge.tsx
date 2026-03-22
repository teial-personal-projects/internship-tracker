import { Box, HStack, Text } from '@chakra-ui/react';
import type { Job } from '@shared/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/theme';

interface Props {
  job: Job;
}

export function StatusBadge({ job }: Props) {
  const colors = STATUS_COLORS[job.status];

  return (
    <HStack
      spacing={1.5}
      display="inline-flex"
      align="center"
      px={2}
      py={0.5}
      borderRadius="full"
      bg={colors?.bg ?? '#F1EFE8'}
    >
      <Box
        w="6px"
        h="6px"
        borderRadius="full"
        flexShrink={0}
        bg={colors?.dot ?? '#888780'}
      />
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color={colors?.color ?? '#444441'}
        whiteSpace="nowrap"
      >
        {STATUS_LABELS[job.status] ?? job.status}
      </Text>
    </HStack>
  );
}
