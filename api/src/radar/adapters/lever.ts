import type { AtsAdapter, NormalizedPosting } from './types';
import { normalizePosting, requireJobsArray } from './helpers';

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
}

export const leverAdapter = new LeverAdapter();
