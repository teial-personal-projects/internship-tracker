import { HStack, Button, Box, Wrap, WrapItem } from '@chakra-ui/react';
import type { QuickFilter } from '@shared/types';

interface Props {
  quickFilter: QuickFilter;
  onQuickFilter: (f: QuickFilter) => void;
}

const QUICK_FILTERS: { label: string; value: QuickFilter }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'SAVED', value: 'saved' },
  { label: 'INTERVIEWING', value: 'interviewing' },
  { label: 'CONFERENCE', value: 'conference' },
  { label: 'DUE SOON', value: 'due_soon' },
  { label: 'STALE', value: 'stale' },
  { label: 'ARCHIVED', value: 'archived' },
];

export function FilterBar({ quickFilter, onQuickFilter }: Props) {
  return (
    <Box mb={4}>
      <Wrap spacing={1}>
        {QUICK_FILTERS.map(({ label, value }) => (
          <WrapItem key={value}>
            <Button
              size="sm"
              variant={quickFilter === value ? 'solid' : 'outline'}
              colorScheme={quickFilter === value ? 'brand' : 'gray'}
              onClick={() => onQuickFilter(value)}
              fontSize="xs"
              fontWeight="semibold"
              letterSpacing="wide"
              borderRadius="full"
              px={4}
            >
              {label}
            </Button>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
}
