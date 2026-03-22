import { useState, useRef } from 'react';
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
import type { Job } from '@shared/types';
import { JobRow } from './JobRow';
import type { ColKey } from './JobRow';

type SortDir = 'asc' | 'desc';

interface ColDef {
  key: ColKey;
  label: string;
  sortFn?: (a: Job, b: Job) => number;
}

const STR = (v: string | null | undefined) => v ?? '';

const ALL_COLS: ColDef[] = [
  { key: 'added',        label: 'Added',         sortFn: (a, b) => STR(a.added).localeCompare(STR(b.added)) },
  { key: 'status',       label: 'Status',        sortFn: (a, b) => a.status.localeCompare(b.status) },
  { key: 'company',      label: 'Company',       sortFn: (a, b) => STR(a.company).localeCompare(STR(b.company)) },
  { key: 'title',        label: 'Title',         sortFn: (a, b) => STR(a.title).localeCompare(STR(b.title)) },
  { key: 'industry',     label: 'Industry',      sortFn: (a, b) => STR(a.industry).localeCompare(STR(b.industry)) },
  { key: 'location',     label: 'Location',      sortFn: (a, b) => STR(a.location).localeCompare(STR(b.location)) },
  { key: 'applied',      label: 'Applied',       sortFn: (a, b) => STR(a.applied_date).localeCompare(STR(b.applied_date)) },
  { key: 'deadline',     label: 'Deadline',      sortFn: (a, b) => STR(a.deadline).localeCompare(STR(b.deadline)) },
  { key: 'job_link',     label: 'Job Link' },
  { key: 'app_link',     label: 'App Link' },
  { key: 'cover_letter', label: 'Cover Letter' },
  { key: 'pay',          label: 'Pay',           sortFn: (a, b) => STR(a.pay).localeCompare(STR(b.pay)) },
  { key: 'notes',        label: 'Notes' },
  { key: 'conference',   label: 'Conference',    sortFn: (a, b) => STR(a.conference).localeCompare(STR(b.conference)) },
  { key: 'actions',      label: 'Actions' },
];

const COL_MAP = Object.fromEntries(ALL_COLS.map(c => [c.key, c])) as Record<ColKey, ColDef>;
const DEFAULT_ORDER: ColKey[] = ALL_COLS.map(c => c.key);
const LS_KEY = 'jobs-col-order';

function loadOrder(): ColKey[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ColKey[];
      if (Array.isArray(parsed) && parsed.every(k => COL_MAP[k as ColKey])) {
        // ensure any new columns added since save are appended
        const missing = DEFAULT_ORDER.filter(k => !parsed.includes(k));
        return [...parsed, ...missing];
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER;
}

interface Props {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMarkApplied: (id: string) => void;
  applyingId?: string | null;
  deletingId?: string | null;
}

export function JobsTable({
  jobs,
  onEdit,
  onDelete,
  onMarkApplied,
  applyingId,
  deletingId,
}: Props) {
  const [colOrder, setColOrder] = useState<ColKey[]>(loadOrder);
  const [sortKey, setSortKey] = useState<ColKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dragOver, setDragOver] = useState<ColKey | null>(null);
  const dragSrc = useRef<ColKey | null>(null);

  if (jobs.length === 0) {
    return (
      <Center py={16} color="gray.400">
        <Text>No jobs here. Add one to get started!</Text>
      </Center>
    );
  }

  function handleSort(key: ColKey) {
    if (!COL_MAP[key].sortFn) return;
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedJobs =
    sortKey && COL_MAP[sortKey].sortFn
      ? [...jobs].sort((a, b) => {
          const cmp = COL_MAP[sortKey].sortFn!(a, b);
          return sortDir === 'asc' ? cmp : -cmp;
        })
      : jobs;

  function handleDragStart(key: ColKey) {
    dragSrc.current = key;
  }

  function handleDragOver(e: React.DragEvent, key: ColKey) {
    e.preventDefault();
    setDragOver(key);
  }

  function handleDrop(target: ColKey) {
    const src = dragSrc.current;
    if (!src || src === target) { setDragOver(null); return; }
    setColOrder(prev => {
      const next = [...prev];
      const si = next.indexOf(src);
      const ti = next.indexOf(target);
      next.splice(si, 1);
      next.splice(ti, 0, src);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    dragSrc.current = null;
    setDragOver(null);
  }

  function handleDragEnd() {
    dragSrc.current = null;
    setDragOver(null);
  }

  return (
    <Box overflowX="auto" borderRadius="md" border="1px solid" borderColor="gray.200" bg="white">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            {colOrder.map(key => {
              const col = COL_MAP[key];
              const isSorted = sortKey === key;
              const canSort = !!col.sortFn;
              const isDropTarget = dragOver === key;

              return (
                <Th
                  key={key}
                  bg={isDropTarget ? 'brand.100' : 'brand.50'}
                  color="brand.700"
                  fontSize="xs"
                  letterSpacing="wide"
                  py={3}
                  whiteSpace="nowrap"
                  borderBottom="2px solid"
                  borderColor={isDropTarget ? 'brand.400' : 'brand.200'}
                  userSelect="none"
                  draggable
                  cursor={canSort ? 'pointer' : 'grab'}
                  _hover={{ bg: 'brand.100' }}
                  transition="background 0.1s, border-color 0.1s"
                  onDragStart={() => handleDragStart(key)}
                  onDragOver={e => handleDragOver(e, key)}
                  onDrop={() => handleDrop(key)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(key)}
                >
                  {col.label}
                  {isSorted && <Text as="span" ml={1}>{sortDir === 'asc' ? '▲' : '▼'}</Text>}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {sortedJobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              colOrder={colOrder}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkApplied={onMarkApplied}
              isApplying={applyingId === job.id}
              isDeleting={deletingId === job.id}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
