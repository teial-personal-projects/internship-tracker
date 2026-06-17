import type { AtsAdapter, NormalizedPosting } from './types';
import { getString, normalizePosting, requireJobsArray } from './helpers';

const SMARTRECRUITERS_BASE_URL = 'https://api.smartrecruiters.com/v1/companies';

interface SmartRecruitersResponse {
  content?: SmartRecruitersPosting[];
}

interface SmartRecruitersPosting {
  id: string;
  uuid?: string | null;
  name: string;
  releasedDate?: string | null;
  postingUrl?: string | null;
  ref?: string | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
}

function formatSmartRecruitersLocation(location: SmartRecruitersPosting['location']): string | null {
  if (!location) return null;
  const parts = [location.city, location.region, location.country]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export class SmartRecruitersAdapter implements AtsAdapter {
  async fetch(boardToken: string): Promise<NormalizedPosting[]> {
    const response = await fetch(`${SMARTRECRUITERS_BASE_URL}/${encodeURIComponent(boardToken)}/postings?limit=100`);
    if (!response.ok) {
      throw new Error(`SmartRecruiters request failed with status ${response.status}`);
    }

    const payload = await response.json() as SmartRecruitersResponse;
    const jobs = requireJobsArray<SmartRecruitersPosting>(payload.content, 'SmartRecruiters');

    return jobs.map((job) => normalizePosting({
      externalId: job.id,
      title: job.name,
      location: formatSmartRecruitersLocation(job.location),
      url: getString(job.postingUrl) ?? getString(job.ref) ?? '',
      postedAt: job.releasedDate ?? null,
      raw: job,
    }));
  }
}

export const smartRecruitersAdapter = new SmartRecruitersAdapter();
