import type { AtsAdapter, NormalizedPosting, PostingValidationInput, PostingValidationResult } from './types';
import { normalizePosting, requireJobsArray } from './helpers';
import { validateByBoardFetch } from './validation';

const LEVER_BASE_URL = 'https://api.lever.co/v0/postings';

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt?: number | null;
  categories?: {
    location?: string | null;
  } | null;
}

export class LeverAdapter implements AtsAdapter {
  async fetch(boardToken: string): Promise<NormalizedPosting[]> {
    const response = await fetch(`${LEVER_BASE_URL}/${encodeURIComponent(boardToken)}?mode=json`);
    if (!response.ok) {
      throw new Error(`Lever request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const jobs = requireJobsArray<LeverPosting>(payload, 'Lever');

    return jobs.map((job) => normalizePosting({
      externalId: job.id,
      title: job.text,
      location: job.categories?.location ?? null,
      url: job.hostedUrl,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      raw: job,
    }));
  }

  async validate(posting: PostingValidationInput): Promise<PostingValidationResult> {
    return validateByBoardFetch(posting, (boardToken) => this.fetch(boardToken));
  }
}

export const leverAdapter = new LeverAdapter();
