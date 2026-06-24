import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WeWorkRemotelyAdapter } from './weWorkRemotely';
import { MVP_MATCH_CRITERIA } from '../match';

describe('WeWorkRemotelyAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes matching postings from official RSS feeds', async () => {
    const xml = readFileSync(resolve(__dirname, '../adapters/__fixtures__/we-work-remotely.rss'), 'utf8');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => xml,
    } as Response);

    const postings = await new WeWorkRemotelyAdapter().search({
      id: 'we_work_remotely',
      name: 'We Work Remotely',
      tier: 'curated_board',
      adapterType: 'we_work_remotely',
      feedUrls: ['https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss'],
      attributionText: 'Jobs from We Work Remotely link back to the original WWR posting.',
    }, MVP_MATCH_CRITERIA);

    expect(fetchMock).toHaveBeenCalledWith('https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss');
    expect(postings).toEqual([expect.objectContaining({
      externalId: 'wwr-backend-1',
      companyName: 'Mission School',
      title: 'Backend Engineer',
      location: 'Remote',
      remoteStatus: 'remote_us',
      url: 'https://weworkremotely.com/remote-jobs/mission-school-backend-engineer',
      sourceName: 'We Work Remotely',
      sourceTier: 'curated_board',
      canonicalUrl: 'https://weworkremotely.com/remote-jobs/mission-school-backend-engineer',
      postedAt: '2026-06-01T12:00:00.000Z',
    })]);
    expect(postings[0].raw).toMatchObject({
      match_reasons: ['title "backend engineer"', 'source We Work Remotely'],
    });
  });
});
