import type { AtsAdapter, NormalizedPosting, PostingValidationInput, PostingValidationResult } from './types';
import { getString, normalizePosting, requireJobsArray } from './helpers';
import { validateByBoardFetch } from './validation';

const ASHBY_BASE_URL = 'https://api.ashbyhq.com/posting-api/job-board';

interface AshbyResponse {
  jobs?: AshbyJob[];
}

interface AshbyJob {
  id: string;
  title: string;
  jobUrl?: string | null;
  applyUrl?: string | null;
  locationName?: string | null;
  location?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export class AshbyAdapter implements AtsAdapter {
  async fetch(boardToken: string): Promise<NormalizedPosting[]> {
    const response = await fetch(`${ASHBY_BASE_URL}/${encodeURIComponent(boardToken)}`);
    if (!response.ok) {
      throw new Error(`Ashby request failed with status ${response.status}`);
    }

    const payload = await response.json() as AshbyResponse;
    const jobs = requireJobsArray<AshbyJob>(payload.jobs, 'Ashby');

    return jobs.map((job) => normalizePosting({
      externalId: job.id,
      title: job.title,
      location: job.locationName ?? job.location ?? null,
      url: getString(job.jobUrl) ?? getString(job.applyUrl) ?? '',
      postedAt: job.publishedAt ?? job.updatedAt ?? null,
      raw: job,
    }));
  }

  async validate(posting: PostingValidationInput): Promise<PostingValidationResult> {
    return validateByBoardFetch(posting, (boardToken) => this.fetch(boardToken));
  }
}

export const ashbyAdapter = new AshbyAdapter();
