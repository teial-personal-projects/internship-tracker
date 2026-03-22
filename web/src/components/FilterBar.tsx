import { Box, HStack, Button, Badge } from '@chakra-ui/react';
import type { Job, QuickFilter } from '@shared/types';

interface Props {
  quickFilter: QuickFilter;
  onQuickFilter: (f: QuickFilter) => void;
  jobs: Job[];
}

interface FilterDef {
  label: string;
  value: QuickFilter;
  getCount: (jobs: Job[]) => number | null;
  badgeBg?: string;
  badgeColor?: string;
}

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const threeDaysStr = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0];

const FILTERS: FilterDef[] = [
  {
    label: 'Active',
    value: 'active',
    getCount: (jobs) => jobs.filter((j) => j.status === 'not_started').length,
    badgeBg: 'whiteAlpha.300',
    badgeColor: 'white',
  },
  {
    label: 'Not Started',
    value: 'not_started',
    getCount: (jobs) => jobs.filter((j) => j.status === 'not_started').length,
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
  },
  {
    label: 'Applied',
    value: 'applied',
    getCount: (jobs) => jobs.filter((j) => !!j.applied_date).length,
    badgeBg: '#E6F1FB',
    badgeColor: '#185FA5',
  },
  {
    label: 'Due Soon',
    value: 'due_soon',
    getCount: (jobs) =>
      jobs.filter(
        (j) =>
          j.deadline &&
          !['applied', 'archive'].includes(j.status) &&
          j.deadline >= todayStr &&
          j.deadline <= threeDaysStr
      ).length,
    badgeBg: '#FCEBEB',
    badgeColor: '#791F1F',
  },
  {
    label: 'Stale',
    value: 'stale',
    getCount: (jobs) =>
      jobs.filter(
        (j) =>
          ['not_started', 'in_progress'].includes(j.status) &&
          new Date(j.added) <= new Date(today.getTime() - 7 * 86400000)
      ).length,
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
  },
  {
    label: 'Archived',
    value: 'archived',
    getCount: (jobs) => jobs.filter((j) => j.status === 'archive').length,
    badgeBg: '#F1EFE8',
    badgeColor: '#5F5E5A',
  },
  {
    label: 'Conference',
    value: 'conference',
    getCount: (jobs) => jobs.filter((j) => !!j.conference).length,
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
  },
  {
    label: 'All',
    value: 'all',
    getCount: (jobs) => jobs.length,
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
  },
];

export function FilterBar({ quickFilter, onQuickFilter, jobs }: Props) {
  return (
    <Box mb={4} overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
      <HStack spacing={2} flexWrap="nowrap" minW="max-content" pb={1}>
        {FILTERS.map(({ label, value, getCount, badgeBg, badgeColor }) => {
          const isActive = quickFilter === value;
          const count = getCount(jobs);
          const showCount = count !== null && count > 0;

          return (
            <Button
              key={value}
              size="sm"
              onClick={() => onQuickFilter(value)}
              borderRadius="full"
              px={4}
              fontWeight="500"
              fontSize="sm"
              flexShrink={0}
              bg={isActive ? 'brand.800' : 'white'}
              color={isActive ? 'white' : 'gray.600'}
              border="1.5px solid"
              borderColor={isActive ? 'brand.800' : 'gray.400'}
              _hover={{
                bg: isActive ? 'brand.700' : 'gray.50',
                borderColor: isActive ? 'brand.700' : 'gray.500',
              }}
              _active={{ transform: 'scale(0.97)' }}
              rightIcon={
                showCount ? (
                  <Badge
                    ml={1}
                    px={1.5}
                    py={0}
                    borderRadius="full"
                    fontSize="12px"
                    fontWeight="700"
                    bg={isActive ? 'whiteAlpha.300' : badgeBg}
                    color={isActive ? 'white' : badgeColor}
                    border="none"
                  >
                    {count}
                  </Badge>
                ) : undefined
              }
            >
              {label}
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}
