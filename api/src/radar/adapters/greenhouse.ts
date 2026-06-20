import type { AtsAdapter, NormalizedPosting } from './types';
import { detectRemoteStatus, normalizeLocation } from '../normalize';

const GREENHOUSE_BASE_URL = 'https://boards-api.greenhouse.io/v1/boards';

interface GreenhouseJob {
  id: number | string;
  title: string;
  absolute_url: string;
  updated_at?: string | null;
  location?: {
    name?: string | null;
  } | null;
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
}

export class GreenhouseAdapter implements AtsAdapter {
  async fetch(boardToken: string): Promise<NormalizedPosting[]> {
    const response = await fetch(
      `${GREENHOUSE_BASE_URL}/${encodeURIComponent(boardToken)}/jobs?content=true`,
    );

    if (!response.ok) {
      throw new Error(`Greenhouse request failed with status ${response.status}`);
    }

    const payload = await response.json() as GreenhouseResponse;
    if (!Array.isArray(payload.jobs)) {
      throw new Error('Greenhouse response did not include a jobs array');
    }

    return payload.jobs.map((job) => {
      const location = normalizeLocation(job.location?.name);

      return {
        externalId: String(job.id),
        title: job.title,
        location,
        remoteStatus: detectRemoteStatus(location),
        url: job.absolute_url,
        postedAt: job.updated_at ?? null,
        raw: job,
      };
    });
  }
}

export const greenhouseAdapter = new GreenhouseAdapter();
