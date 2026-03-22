import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Skeleton,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  Center,
} from '@chakra-ui/react';
import { addDays, parseISO, subDays } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import type { Job, QuickFilter, CreateJobInput } from '@shared/types';
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob, useMarkApplied } from '@/hooks/useJobs';
import { AlertBar } from '@/components/AlertBar';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { JobsTable } from '@/components/JobsTable';
import { JobModal } from '@/components/JobModal';
import { UserMenu } from '@/components/UserMenu';
const TODAY = new Date().toISOString().split('T')[0];

// ── Empty state placeholder ───────────────────────────────────────────────

function TablePlaceholder({ onAdd }: { onAdd: () => void }) {
  const cols = ['Company', 'Title', 'Location', 'Added', 'Deadline', 'Status', 'Actions'];
  return (
    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden">
      {/* fake header row */}
      <Box overflowX="auto">
        <Box as="table" w="full" style={{ borderCollapse: 'collapse' }}>
          <Box as="thead">
            <Box as="tr" bg="brand.50">
              {cols.map((c) => (
                <Box
                  as="th"
                  key={c}
                  px={4}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="brand.700"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  borderBottom="2px solid"
                  borderColor="brand.200"
                  whiteSpace="nowrap"
                >
                  {c}
                </Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {[...Array(5)].map((_, i) => (
              <Box as="tr" key={i} borderBottom="1px solid" borderColor="gray.100">
                {cols.map((c) => (
                  <Box as="td" key={c} px={4} py={3}>
                    <Skeleton
                      height="14px"
                      borderRadius="md"
                      startColor="gray.100"
                      endColor="gray.200"
                      w={c === 'Actions' ? '80px' : c === 'Status' ? '70px' : `${60 + Math.random() * 40}%`}
                    />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* overlay CTA */}
      <Center
        position="absolute"
        inset={0}
        bg="whiteAlpha.800"
        backdropFilter="blur(2px)"
        flexDir="column"
        gap={3}
        borderRadius="xl"
      >
        <Text fontSize="3xl">💼</Text>
        <Text fontWeight="semibold" color="gray.700">No jobs yet</Text>
        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="260px">
          Add your first job to start tracking applications and deadlines.
        </Text>
        <Button colorScheme="brand" size="sm" onClick={onAdd}>
          + Add your first job
        </Button>
      </Center>
    </Box>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────

export function DashboardPage() {
  const toast = useToast();

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('active');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: jobs = [], isLoading, error } = useJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const markApplied = useMarkApplied();

  const filteredJobs = applyFilter(jobs, quickFilter);

  function applyFilter(jobs: Job[], qf: QuickFilter): Job[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysStr = addDays(today, 3).toISOString().split('T')[0];
    if (qf === 'active') return jobs.filter((j) => j.status === 'not_started');
    if (qf === 'applied') return jobs.filter((j) => !!j.applied_date);
    if (qf === 'conference') return jobs.filter((j) => !!j.conference);
    if (qf === 'due_soon') return jobs.filter(
      (j) => j.deadline && !['applied', 'archive'].includes(j.status) &&
        j.deadline >= todayStr && j.deadline <= threeDaysStr
    );
    if (qf === 'stale') return jobs.filter(
      (j) => ['not_started', 'in_progress'].includes(j.status) && parseISO(j.added) <= subDays(today, 7)
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

  function handleEdit(job: Job) { setEditingJob(job); onOpen(); }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deleteJob.mutateAsync(id); toast({ title: 'Job deleted', status: 'info', duration: 2000 }); }
    catch { toast({ title: 'Delete failed', status: 'error', duration: 3000 }); }
    finally { setDeletingId(null); }
  }

  async function handleMarkApplied(id: string) {
    setApplyingId(id);
    try { await markApplied.mutateAsync(id); toast({ title: 'Marked as applied', status: 'success', duration: 2000 }); }
    catch { toast({ title: 'Update failed', status: 'error', duration: 3000 }); }
    finally { setApplyingId(null); }
  }

  function openAdd() { setEditingJob(null); onOpen(); }

  return (
    <Flex minH="100vh" flexDir="column" bg="#F5F5F3">

      {/* ── Header ── */}
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={20}
        boxShadow="lg"
        bg="brand.800"
      >
        <Flex
          align="center"
          justify="space-between"
          maxW="screen-2xl"
          mx="auto"
          px={{ base: 4, sm: 6 }}
          py={{ base: 3, sm: 4 }}
          gap={4}
        >
          {/* Logo */}
          <HStack spacing={3}>
            <Box
              w={8}
              h={8}
              borderRadius="lg"
              bg="accent.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="md" lineHeight={1}>🚀</Text>
            </Box>
            <Box>
              <Heading
                as="h1"
                size="md"
                color="white"
                letterSpacing="tight"
                lineHeight="tight"
              >
                LaunchPad
              </Heading>
              <Text fontSize="xs" color="whiteAlpha.600" display={{ base: 'none', sm: 'block' }} mt={0.5}>
                your internship command center
              </Text>
            </Box>
          </HStack>

          {/* Right actions */}
          <HStack spacing={3}>
            <Button
              as={RouterLink}
              to="/profile"
              size="sm"
              bg="transparent"
              color="accent.200"
              border="1.5px solid"
              borderColor="accent.400"
              _hover={{ bg: 'whiteAlpha.100' }}
              leftIcon={<Text as="span" fontSize="md">👤</Text>}
            >
              Profile
            </Button>
            <UserMenu />
          </HStack>
        </Flex>
      </Box>

      {/* ── Main content ── */}
      <Box as="main" flex={1} minW={0} p={{ base: 4, sm: 6 }} pb={24} display="flex" flexDir="column" gap={4}>

          {/* Today date */}
          <Text fontSize="xs" color="gray.500" fontWeight="medium">
            Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          {/* Alert bar */}
          {!isLoading && <AlertBar jobs={jobs} />}

          {/* Stats bar */}
          {isLoading
            ? <Skeleton height="72px" borderRadius="lg" />
            : <StatsBar jobs={jobs} />
          }

          {/* Add button */}
          <Flex justify="flex-end">
            <Button colorScheme="brand" size="sm" onClick={openAdd} boxShadow="sm">
              + Add Job
            </Button>
          </Flex>

          {/* Filter bar */}
          <FilterBar quickFilter={quickFilter} onQuickFilter={setQuickFilter} />

          {/* Error */}
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              Failed to load jobs. Please refresh.
            </Alert>
          )}

          {/* Table or spinner or placeholder */}
          {isLoading ? (
            <Center py={16}><Spinner color="brand.500" size="lg" /></Center>
          ) : jobs.length === 0 ? (
            <Box position="relative">
              <TablePlaceholder onAdd={openAdd} />
            </Box>
          ) : (
            <JobsTable
              jobs={filteredJobs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkApplied={handleMarkApplied}
              applyingId={applyingId}
              deletingId={deletingId}
            />
          )}
      </Box>

      {/* Add/Edit Modal */}
      <JobModal
        isOpen={isOpen}
        onClose={() => { setEditingJob(null); onClose(); }}
        onSubmit={handleSubmit}
        isLoading={createJob.isPending || updateJob.isPending}
        defaultValues={editingJob ?? { added: TODAY }}
        title={editingJob ? 'Edit Job' : 'Add Job'}
      />
    </Flex>
  );
}
