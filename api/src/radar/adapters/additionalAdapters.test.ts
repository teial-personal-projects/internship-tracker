import { afterEach, describe, expect, it, vi } from 'vitest';
import leverFixture from './__fixtures__/lever.json';
import ashbyFixture from './__fixtures__/ashby.json';
import smartRecruitersFixture from './__fixtures__/smartrecruiters.json';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LeverAdapter } from './lever';
import { AshbyAdapter } from './ashby';
import { SmartRecruitersAdapter } from './smartrecruiters';
import { CustomSiteAdapter, PinpointAdapter, WelcomeKitAdapter } from './htmlFallback';

function mockJsonFetch(payload: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => payload,
  } as Response);
}

function mockHtmlFetch(filename: string) {
  const html = readFileSync(resolve(__dirname, '__fixtures__', filename), 'utf8');
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    text: async () => html,
  } as Response);
}

describe('additional ATS adapters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes Lever postings', async () => {
    const fetchMock = mockJsonFetch(leverFixture);
    const postings = await new LeverAdapter().fetch('age-of-learning');

    expect(fetchMock).toHaveBeenCalledWith('https://api.lever.co/v0/postings/age-of-learning?mode=json');
    expect(postings).toEqual([{
      externalId: 'lever-1',
      title: 'Senior Backend Engineer',
      location: 'Remote - US',
      remoteStatus: 'remote_us',
      url: 'https://jobs.lever.co/example/lever-1',
      postedAt: '2026-06-01T12:00:00.000Z',
      raw: leverFixture[0],
    }]);
  });

  it('normalizes Ashby postings', async () => {
    const fetchMock = mockJsonFetch(ashbyFixture);
    const postings = await new AshbyAdapter().fetch('instructure');

    expect(fetchMock).toHaveBeenCalledWith('https://api.ashbyhq.com/posting-api/job-board/instructure');
    expect(postings).toEqual([{
      externalId: 'ashby-1',
      title: 'Staff Product Engineer',
      location: 'Los Angeles, CA',
      remoteStatus: 'la',
      url: 'https://jobs.ashbyhq.com/example/ashby-1',
      postedAt: '2026-06-02T15:00:00.000Z',
      raw: ashbyFixture.jobs[0],
    }]);
  });

  it('normalizes SmartRecruiters postings', async () => {
    const fetchMock = mockJsonFetch(smartRecruitersFixture);
    const postings = await new SmartRecruitersAdapter().fetch('turnitin');

    expect(fetchMock).toHaveBeenCalledWith('https://api.smartrecruiters.com/v1/companies/turnitin/postings?limit=100');
    expect(postings).toEqual([{
      externalId: 'smart-1',
      title: 'Senior Full Stack Engineer',
      location: 'Remote, US, United States',
      remoteStatus: 'remote_us',
      url: 'https://jobs.smartrecruiters.com/example/smart-1',
      postedAt: '2026-06-03T10:00:00.000Z',
      raw: smartRecruitersFixture.content[0],
    }]);
  });

  it('normalizes Pinpoint HTML fallback postings', async () => {
    const fetchMock = mockHtmlFetch('pinpoint.html');
    const postings = await new PinpointAdapter().fetch('https://example.pinpointhq.com/');

    expect(fetchMock).toHaveBeenCalledWith('https://example.pinpointhq.com/');
    expect(postings).toEqual([expect.objectContaining({
      externalId: 'https://example.pinpointhq.com/jobs/123-senior-engineer',
      title: 'Senior Platform Engineer',
      url: 'https://example.pinpointhq.com/jobs/123-senior-engineer',
      remoteStatus: 'unknown',
    })]);
  });

  it('normalizes Welcome Kit HTML fallback postings', async () => {
    mockHtmlFetch('welcomekit.html');
    const postings = await new WelcomeKitAdapter().fetch('https://www.welcometothejungle.com/en/companies/example/jobs');

    expect(postings[0]).toMatchObject({
      externalId: 'https://www.welcometothejungle.com/en/companies/example/jobs/staff-engineer',
      title: 'Staff Engineer',
      url: 'https://www.welcometothejungle.com/en/companies/example/jobs/staff-engineer',
      remoteStatus: 'unknown',
    });
  });

  it('normalizes custom-site fallback postings for Nerdy', async () => {
    const fetchMock = mockHtmlFetch('custom-site.html');
    const postings = await new CustomSiteAdapter().fetch('ignored-token');

    expect(fetchMock).toHaveBeenCalledWith('https://careers.varsitytutors.com/');
    expect(postings[0]).toMatchObject({
      externalId: 'https://careers.varsitytutors.com/careers/job/senior-learning-engineer',
      title: 'Senior Learning Engineer',
      url: 'https://careers.varsitytutors.com/careers/job/senior-learning-engineer',
      remoteStatus: 'unknown',
    });
  });
});
