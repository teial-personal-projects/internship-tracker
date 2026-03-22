import { HStack, Button, Box } from '@chakra-ui/react';
import type { QuickFilter } from '@shared/types';

interface Props {
  quickFilter: QuickFilter;
  onQuickFilter: (f: QuickFilter) => void;
}

const QUICK_FILTERS: { label: string; value: QuickFilter }[] = [
  { label: 'ACTIVE',     value: 'active' },
  { label: 'APPLIED',    value: 'applied' },
  { label: 'DUE SOON',   value: 'due_soon' },
  { label: 'STALE',      value: 'stale' },
  { label: 'ARCHIVED',   value: 'archived' },
  { label: 'CONFERENCE', value: 'conference' },
  { label: 'ALL',        value: 'all' },
];

export function FilterBar({ quickFilter, onQuickFilter }: Props) {
  return (
    <Box mb={4} overflowX="auto">
      <HStack spacing={1} flexWrap="nowrap" minW="max-content">
        {QUICK_FILTERS.map(({ label, value }) => (
          <Button
            key={value}
            size="sm"
            variant={quickFilter === value ? 'solid' : 'outline'}
            colorScheme={quickFilter === value ? 'brand' : 'gray'}
            onClick={() => onQuickFilter(value)}
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="wide"
            borderRadius="full"
            px={4}
            flexShrink={0}
          >
            {label}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}
