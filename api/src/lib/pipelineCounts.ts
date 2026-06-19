import {
  ApplicationStatusSchema,
  type ApplicationStatus,
  type TodayFunnelBucket,
} from '@internship-tracker/shared';

interface PipelineRow {
  status: ApplicationStatus;
}

interface PipelineQueryResult {
  data: PipelineRow[] | null;
  error: { message: string } | null;
}

interface PipelineQuery {
  eq(column: 'user_id', value: string): PromiseLike<PipelineQueryResult>;
}

interface PipelineSelect {
  select(columns: 'status'): PipelineQuery;
}

export interface PipelineCountsDb {
  from(table: 'applications'): PipelineSelect;
}

export type PipelineCounts = Record<ApplicationStatus, number>;

export interface PipelineCountsResult {
  counts: PipelineCounts;
  total: number;
}

const APPLICATION_STATUSES = ApplicationStatusSchema.options;

const TODAY_BUCKETS: Array<{
  key: string;
  label: string;
  statuses: ApplicationStatus[];
}> = [
  {
    key: 'applied',
    label: 'Applied',
    statuses: ['applied', 'screening', 'interviewing', 'technical', 'on_site', 'final_round', 'offered'],
  },
  {
    key: 'screening',
    label: 'Phone screen',
    statuses: ['screening', 'interviewing', 'technical', 'on_site', 'final_round', 'offered'],
  },
  { key: 'technical', label: 'Technical', statuses: ['technical', 'on_site', 'final_round', 'offered'] },
  { key: 'final_offer', label: 'Final / Offer', statuses: ['final_round', 'offered'] },
];

function emptyPipelineCounts(): PipelineCounts {
  return Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [status, 0]),
  ) as PipelineCounts;
}

export async function getPipelineCounts(
  db: PipelineCountsDb,
  userId: string,
): Promise<PipelineCountsResult> {
  const { data, error } = await db
    .from('applications')
    .select('status')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  const counts = emptyPipelineCounts();
  for (const row of data ?? []) {
    counts[row.status] += 1;
  }

  return {
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };
}

export function getTodayPipelineBuckets({ counts }: PipelineCountsResult): TodayFunnelBucket[] {
  const appliedDenominator = TODAY_BUCKETS[0].statuses.reduce((sum, status) => sum + counts[status], 0);

  return TODAY_BUCKETS.map((bucket) => {
    const count = bucket.statuses.reduce((sum, status) => sum + counts[status], 0);

    return {
      key: bucket.key,
      label: bucket.label,
      count,
      percent: appliedDenominator === 0 ? 0 : Math.round((count / appliedDenominator) * 1000) / 10,
    };
  });
}
