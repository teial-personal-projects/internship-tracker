import { SimpleGrid, Box, Text } from '@chakra-ui/react';
import type { Job } from '@shared/types';

interface Props {
  jobs: Job[];
}

interface StatCard {
  label: string;
  sublabel: string;
  getValue: (jobs: Job[]) => number;
  bg: string;
  labelColor: string;
  valueColor: string;
  sublabelColor: string;
  borderColor?: string;
}

const STAT_CARDS: StatCard[] = [
  {
    label: 'Total',
    sublabel: 'jobs tracked',
    getValue: (jobs) => jobs.length,
    bg: 'brand.800',
    labelColor: 'whiteAlpha.600',
    valueColor: 'white',
    sublabelColor: 'whiteAlpha.400',
  },
  {
    label: 'Saved',
    sublabel: 'not yet applied',
    getValue: (jobs) => jobs.filter((j) => j.status === 'not_started').length,
    bg: 'brand.50',
    labelColor: 'brand.600',
    valueColor: 'brand.800',
    sublabelColor: 'brand.400',
    borderColor: 'brand.200',
  },
  {
    label: 'Applied',
    sublabel: 'apps submitted',
    getValue: (jobs) => jobs.filter((j) => !!j.applied_date).length,
    bg: 'accent.50',
    labelColor: 'accent.600',
    valueColor: 'accent.800',
    sublabelColor: 'accent.400',
    borderColor: 'accent.200',
  },
  {
    label: 'Interviewing',
    sublabel: 'in progress',
    getValue: (jobs) => jobs.filter((j) => j.status === 'in_progress').length,
    bg: '#EEEDFE',
    labelColor: '#534AB7',
    valueColor: '#3C3489',
    sublabelColor: '#7F77DD',
    borderColor: '#AFA9EC',
  },
];

export function StatsBar({ jobs }: Props) {
  return (
    <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} mb={4}>
      {STAT_CARDS.map(({ label, sublabel, getValue, bg, labelColor, valueColor, sublabelColor, borderColor }) => (
        <Box
          key={label}
          bg={bg}
          borderRadius="xl"
          px={4}
          py={3}
          border={borderColor ? '0.5px solid' : undefined}
          borderColor={borderColor}
        >
          <Text
            fontSize="10px"
            fontWeight="semibold"
            color={labelColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={1}
          >
            {label}
          </Text>
          <Text fontSize="3xl" fontWeight="500" color={valueColor} lineHeight="1">
            {getValue(jobs)}
          </Text>
          <Text fontSize="11px" color={sublabelColor} mt={1}>
            {sublabel}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}
