import { Alert, AlertIcon, Box, HStack, Text } from '@chakra-ui/react';
import { addDays, isWithinInterval, parseISO, subDays } from 'date-fns';
import type { Job } from '@shared/types';

interface Props {
  jobs: Job[];
}

export function AlertBar({ jobs }: Props) {
  const today = new Date();
  const threeDaysOut = addDays(today, 3);
  const sevenDaysAgo = subDays(today, 7);

  const dueSoon = jobs.filter(
    (j) =>
      j.deadline &&
      !['applied', 'archive'].includes(j.status) &&
      isWithinInterval(parseISO(j.deadline), { start: today, end: threeDaysOut })
  );

  const stale = jobs.filter(
    (j) =>
      ['not_started', 'in_progress'].includes(j.status) &&
      parseISO(j.added) <= sevenDaysAgo
  );

  if (!dueSoon.length && !stale.length) return null;

  return (
    <Alert
      status="warning"
      borderRadius="md"
      mb={4}
      bg="orange.50"
      borderLeft="4px solid"
      borderLeftColor="orange.400"
    >
      <AlertIcon color="orange.400" />
      <HStack spacing={6} wrap="wrap">
        {dueSoon.length > 0 && (
          <Box>
            <Text as="span" fontWeight="semibold" fontSize="sm" color="orange.700">
              {dueSoon.length === 1 ? '1 application' : `${dueSoon.length} applications`} due within 3 days:{' '}
            </Text>
            <Text as="span" fontSize="sm" color="orange.800">
              {dueSoon.map((j) => j.company).join(', ')}
            </Text>
          </Box>
        )}
        {stale.length > 0 && (
          <Box>
            <Text as="span" fontWeight="semibold" fontSize="sm" color="orange.700">
              {stale.length === 1 ? '1 job' : `${stale.length} jobs`} saved 7+ days without applying:{' '}
            </Text>
            <Text as="span" fontSize="sm" color="orange.800">
              {stale.map((j) => j.company).join(', ')}
            </Text>
          </Box>
        )}
      </HStack>
    </Alert>
  );
}
