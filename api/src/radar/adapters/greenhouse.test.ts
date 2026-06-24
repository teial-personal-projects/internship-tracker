import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from './__fixtures__/greenhouse.json';
import { GreenhouseAdapter } from './greenhouse';

describe('GreenhouseAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and normalizes Greenhouse jobs', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => fixture,
    } as Response);

    const postings = await new GreenhouseAdapter().fetch('example-board');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://boards-api.greenhouse.io/v1/boards/example-board/jobs?content=true',
    );
    expect(postings).toEqual([
      {
        externalId: '101',
        title: 'Senior Software Engineer',
        location: 'Remote - United States',
        remoteStatus: 'remote_us',
        url: 'https://boards.greenhouse.io/example/jobs/101',
        postedAt: '2026-06-01T12:00:00-04:00',
        raw: fixture.jobs[0],
      },
      {
        externalId: 'job-202',
        title: 'Staff Infrastructure Engineer',
        location: 'Los Angeles, CA',
        remoteStatus: 'la',
        url: 'https://boards.greenhouse.io/example/jobs/202',
        postedAt: null,
        raw: fixture.jobs[1],
      },
    ]);
  });

  it('throws a clear error when the Greenhouse request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    await expect(new GreenhouseAdapter().fetch('missing')).rejects.toThrow(
      'Greenhouse request failed with status 404',
    );
  });

  it('validates missing Greenhouse jobs as closed after a successful board response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => fixture,
    } as Response);

    await expect(new GreenhouseAdapter().validate?.({
      boardToken: 'example-board',
      externalId: 'missing-job',
      title: 'Senior Software Engineer',
      location: 'Remote - United States',
      remoteStatus: 'remote_us',
      url: 'https://boards.greenhouse.io/example/jobs/missing-job',
      postedAt: null,
      raw: {},
    })).resolves.toEqual({
      status: 'closed',
      error: null,
    });
  });
});
