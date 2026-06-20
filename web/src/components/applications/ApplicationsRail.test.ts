import { describe, expect, it } from 'vitest';
import { getPipelineStageRows, PIPELINE_STAGES } from './ApplicationsRail';

describe('getPipelineStageRows', () => {
  it('keeps every pipeline stage visible and fills missing counts with zero', () => {
    const rows = getPipelineStageRows({ applied: 3, interviewing: 1 });

    expect(rows).toHaveLength(PIPELINE_STAGES.length);
    expect(rows.find((row) => row.status === 'applied')?.count).toBe(3);
    expect(rows.find((row) => row.status === 'interviewing')?.count).toBe(1);
    expect(rows.find((row) => row.status === 'offered')?.count).toBe(0);
  });
});
