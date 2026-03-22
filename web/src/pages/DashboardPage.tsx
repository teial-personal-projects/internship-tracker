import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Skeleton,
  Spinner,
  Tab,
  TabList,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { addDays, isWithinInterval, parseISO, subDays } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import type { FilterTab, Job, QuickFilter, CreateJobInput } from '@shared/types';
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob, useCycleStatus, useMarkApplied } from '@/hooks/useJobs';
import { AlertBar } from '@/components/AlertBar';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { JobsTable } from '@/components/JobsTable';
import { JobModal } from '@/components/JobModal';
import { supabase } from '@/lib/supabaseClient';

const TODAY = new Date().toISOString().split('T')[0];

export function DashboardPage() {
  const toast = useToast();

  // Tab state
  const [tabIndex, setTabIndex] = useState(0);
  const tab: FilterTab = tabIndex === 0 ? 'active' : 'applied_archived';

  // Filter state
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Mutation tracking for per-row loading states
  const [cyclingId, setCyclingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Data
  const { data: jobs = [], isLoading, error } = useJobs(tab);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const cycleStatus = useCycleStatus();
  const markApplied = useMarkApplied();

  // Apply filters client-side
  const filteredJobs = applyFilters(jobs, quickFilter);

  function applyFilters(jobs: Job[], qf: QuickFilter): Job[] {
    const today = new Date();

    if (qf === 'saved') return jobs.filter((j) => j.status === 'not_started');
    if (qf === 'interviewing') return jobs.filter((j) => j.status === 'in_progress' && j.interview_date);
    if (qf === 'conference') return jobs.filter((j) => !!j.conference);
    if (qf === 'due_soon') return jobs.filter(
      (j) =>
        j.deadline &&
        !['applied', 'archive'].includes(j.status) &&
        isWithinInterval(parseISO(j.deadline), { start: today, end: addDays(today, 3) })
    );
    if (qf === 'stale') return jobs.filter(
      (j) =>
        ['not_started', 'in_progress'].includes(j.status) &&
        parseISO(j.added) <= subDays(today, 7)
    );
    if (qf === 'archived') return jobs.filter((j) => j.status === 'archive');
    return jobs;
  }

  async function handleSubmit(formData: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      if (editingJob) {
        await updateJob.mutateAsync({ id: editingJob.id, data: formData });
        toast({ title: 'Job updated', status: 'success', duration: 2000 });
      } else {
        await createJob.mutateAsync(formData as CreateJobInput);
        toast({ title: 'Job added', status: 'success', duration: 2000 });
      }
      setEditingJob(null);
      onClose();
    } catch {
      toast({ title: 'Something went wrong', status: 'error', duration: 3000 });
    }
  }

  function handleEdit(job: Job) {
    setEditingJob(job);
    onOpen();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteJob.mutateAsync(id);
      toast({ title: 'Job deleted', status: 'info', duration: 2000 });
    } catch {
      toast({ title: 'Delete failed', status: 'error', duration: 3000 });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCycleStatus(id: string, currentStatus: import('@shared/types').JobStatus) {
    setCyclingId(id);
    try {
      await cycleStatus.mutateAsync({ id, currentStatus });
    } catch {
      toast({ title: 'Status update failed', status: 'error', duration: 3000 });
    } finally {
      setCyclingId(null);
    }
  }

  async function handleMarkApplied(id: string) {
    setApplyingId(id);
    try {
      await markApplied.mutateAsync(id);
      toast({ title: 'Marked as applied', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Update failed', status: 'error', duration: 3000 });
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={4}>
        <Flex align="center" justify="space-between" maxW="1600px" mx="auto">
          <Heading size="md" color="brand.700" fontStyle="italic">
            Internship <Text as="span" fontWeight="normal">Tracker</Text>
          </Heading>
          <HStack spacing={3}>
            <Text fontSize="sm" color="gray.500">
              Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Button as={RouterLink} to="/profile" variant="ghost" size="sm" colorScheme="brand">
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              colorScheme="gray"
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Container maxW="1600px" px={6} py={6}>
        {/* Alert bar — derived from ALL active jobs, not filtered */}
        {!isLoading && <AlertBar jobs={jobs} />}

        {/* Stats bar */}
        {isLoading ? (
          <Skeleton height="72px" borderRadius="md" mb={4} />
        ) : (
          <StatsBar jobs={jobs} />
        )}

        {/* Tabs */}
        <Tabs index={tabIndex} onChange={(i) => { setTabIndex(i); setQuickFilter('all'); }} colorScheme="brand" mb={4}>
          <TabList>
            <Tab fontWeight="semibold" fontSize="sm">
              Active{' '}
              {!isLoading && tabIndex === 0 && (
                <Text as="span" ml={1} fontSize="xs" bg="brand.100" color="brand.700" px={1.5} borderRadius="full">
                  {jobs.length}
                </Text>
              )}
            </Tab>
            <Tab fontWeight="semibold" fontSize="sm">
              Applied / Archived{' '}
              {!isLoading && tabIndex === 1 && (
                <Text as="span" ml={1} fontSize="xs" bg="brand.100" color="brand.700" px={1.5} borderRadius="full">
                  {jobs.length}
                </Text>
              )}
            </Tab>
          </TabList>
        </Tabs>

        {/* Action row */}
        <Flex justify="space-between" align="center" mb={4}>
          <Button
            colorScheme="brand"
            size="sm"
            onClick={() => { setEditingJob(null); onOpen(); }}
            leftIcon={<Text>+</Text>}
          >
            Add Job
          </Button>
        </Flex>

        {/* Filter bar */}
        <FilterBar
          quickFilter={quickFilter}
          onQuickFilter={setQuickFilter}
        />

        {/* Error */}
        {error && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            Failed to load jobs. Please refresh.
          </Alert>
        )}

        {/* Table */}
        {isLoading ? (
          <Box textAlign="center" py={16}><Spinner color="brand.500" size="lg" /></Box>
        ) : (
          <JobsTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCycleStatus={handleCycleStatus}
            onMarkApplied={handleMarkApplied}
            cyclingId={cyclingId}
            applyingId={applyingId}
            deletingId={deletingId}
          />
        )}
      </Container>

      {/* Add/Edit Modal */}
      <JobModal
        isOpen={isOpen}
        onClose={() => { setEditingJob(null); onClose(); }}
        onSubmit={handleSubmit}
        isLoading={createJob.isPending || updateJob.isPending}
        defaultValues={editingJob ?? { added: TODAY }}
        title={editingJob ? 'Edit Job' : 'Add Job'}
      />
    </Box>
  );
}
