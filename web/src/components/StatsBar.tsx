import { HStack, Box, Text, Divider } from '@chakra-ui/react';
import type { Job } from '@shared/types';

interface Props {
  jobs: Job[];
}

export function StatsBar({ jobs }: Props) {
  const total = jobs.length;
  const saved = jobs.filter((j) => j.status === 'not_started').length;
  const applied = jobs.filter((j) => j.status === 'applied').length;
  const interviewing = jobs.filter((j) => j.status === 'in_progress' && j.interview_date).length;
  const confVisits = jobs.filter((j) => j.conference).length;

  const stats = [
    { label: 'TOTAL', value: total },
    { label: 'SAVED', value: saved },
    { label: 'APPLIED', value: applied },
    { label: 'INTERVIEWING', value: interviewing },
    { label: 'CONF VISITS', value: confVisits },
  ];

  return (
    <HStack
      spacing={0}
      bg="white"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      px={6}
      py={3}
      mb={4}
      divider={<Divider orientation="vertical" h="40px" />}
    >
      {stats.map(({ label, value }) => (
        <Box key={label} px={6} textAlign="center" flex="1">
          <Text fontSize="2xl" fontWeight="bold" color="brand.700" lineHeight="1">
            {value}
          </Text>
          <Text fontSize="10px" fontWeight="semibold" color="gray.500" letterSpacing="wider" mt={0.5}>
            {label}
          </Text>
        </Box>
      ))}
    </HStack>
  );
}
