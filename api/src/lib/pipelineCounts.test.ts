import { describe, expect, it } from 'vitest';
import { getPipelineCounts, getTodayPipelineBuckets, type PipelineCountsDb } from './pipelineCounts';
import type { ApplicationStatus } from '@internship-tracker/shared';

interface ApplicationRow {
  user_id: string;
  status: ApplicationStatus;
}

interface QueryCall {
  method: string;
  args: unknown[];
}

class PipelineQuery {
  readonly calls: QueryCall[] = [];

  constructor(private readonly rows: ApplicationRow[]) {}

  select(...args: ['status']) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: ['user_id', string]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: Array<Pick<ApplicationRow, 'status'>>; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const userCall = this.calls.find((call) => call.method === 'eq' && call.args[0] === 'user_id');
    const userId = userCall?.args[1];
    const data = this.rows
      .filter((row) => row.user_id === userId)
      .map((row) => ({ status: row.status }));

    return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
  }
}

function createDb(query: PipelineQuery): PipelineCountsDb {
  return {
    from(table: 'applications') {
      expect(table).toBe('applications');
      return query;
    },
  };
}

describe('getPipelineCounts', () => {
  it('returns full status granularity scoped to the requesting user', async () => {
    const query = new PipelineQuery([
      { user_id: 'user-1', status: 'applied' },
      { user_id: 'user-1', status: 'applied' },
      { user_id: 'user-1', status: 'screening' },
      { user_id: 'user-2', status: 'offered' },
    ]);

    const result = await getPipelineCounts(createDb(query), 'user-1');

    expect(result.counts.applied).toBe(2);
    expect(result.counts.screening).toBe(1);
    expect(result.counts.offered).toBe(0);
    expect(result.counts.not_started).toBe(0);
    expect(result.total).toBe(3);
    expect(query.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
  });

  it('sums to the requesting user total applications', async () => {
    const query = new PipelineQuery([
      { user_id: 'user-1', status: 'not_started' },
      { user_id: 'user-1', status: 'in_progress' },
      { user_id: 'user-1', status: 'technical' },
      { user_id: 'user-1', status: 'final_round' },
      { user_id: 'user-1', status: 'offered' },
      { user_id: 'user-2', status: 'technical' },
    ]);

    const result = await getPipelineCounts(createDb(query), 'user-1');

    const sum = Object.values(result.counts).reduce((total, count) => total + count, 0);
    expect(sum).toBe(5);
    expect(result.total).toBe(5);
  });
});

describe('getTodayPipelineBuckets', () => {
  it('returns cumulative Applied-denominator funnel buckets for Today', async () => {
    const result = await getPipelineCounts(
      createDb(new PipelineQuery([
        { user_id: 'user-1', status: 'applied' },
        { user_id: 'user-1', status: 'screening' },
        { user_id: 'user-1', status: 'technical' },
        { user_id: 'user-1', status: 'final_round' },
        { user_id: 'user-1', status: 'offered' },
      ])),
      'user-1',
    );

    expect(getTodayPipelineBuckets(result)).toEqual([
      { key: 'applied', label: 'Applied', count: 5, percent: 100 },
      { key: 'screening', label: 'Phone screen', count: 4, percent: 80 },
      { key: 'technical', label: 'Technical', count: 3, percent: 60 },
      { key: 'final_offer', label: 'Final / Offer', count: 2, percent: 40 },
    ]);
  });

  it('uses zero percentages when there is no Applied denominator', async () => {
    const result = await getPipelineCounts(
      createDb(new PipelineQuery([
        { user_id: 'user-1', status: 'not_started' },
        { user_id: 'user-1', status: 'in_progress' },
      ])),
      'user-1',
    );

    expect(getTodayPipelineBuckets(result)).toEqual([
      { key: 'applied', label: 'Applied', count: 0, percent: 0 },
      { key: 'screening', label: 'Phone screen', count: 0, percent: 0 },
      { key: 'technical', label: 'Technical', count: 0, percent: 0 },
      { key: 'final_offer', label: 'Final / Offer', count: 0, percent: 0 },
    ]);
  });

  it('returns monotonically non-increasing funnel rows across status distributions', async () => {
    const distributions: ApplicationRow[][] = [
      [
        { user_id: 'user-1', status: 'applied' },
        { user_id: 'user-1', status: 'screening' },
        { user_id: 'user-1', status: 'technical' },
        { user_id: 'user-1', status: 'final_round' },
      ],
      [
        { user_id: 'user-1', status: 'screening' },
        { user_id: 'user-1', status: 'screening' },
        { user_id: 'user-1', status: 'on_site' },
        { user_id: 'user-1', status: 'offered' },
      ],
      [
        { user_id: 'user-1', status: 'not_started' },
        { user_id: 'user-1', status: 'in_progress' },
        { user_id: 'user-1', status: 'rejected' },
        { user_id: 'user-1', status: 'withdrawn' },
      ],
    ];

    for (const rows of distributions) {
      const result = await getPipelineCounts(createDb(new PipelineQuery(rows)), 'user-1');
      const buckets = getTodayPipelineBuckets(result);

      for (let index = 1; index < buckets.length; index += 1) {
        expect(buckets[index].count).toBeLessThanOrEqual(buckets[index - 1].count);
        expect(buckets[index].percent).toBeLessThanOrEqual(buckets[index - 1].percent);
      }
    }
  });
});
