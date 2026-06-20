import type { NormalizedPosting } from './types';
import { detectRemoteStatus, normalizeLocation } from '../normalize';

export function requireJobsArray<T>(jobs: unknown, source: string): T[] {
  if (!Array.isArray(jobs)) {
    throw new Error(`${source} response did not include a jobs array`);
  }
  return jobs as T[];
}

export function toAbsoluteUrl(url: string, baseUrl: string): string {
  return new URL(url, baseUrl).toString();
}

export function normalizePosting(input: {
  externalId: string | number;
  title: string;
  location?: string | null;
  url: string;
  postedAt?: string | null;
  raw: unknown;
}): NormalizedPosting {
  const location = normalizeLocation(input.location);
  return {
    externalId: String(input.externalId),
    title: input.title,
    location,
    remoteStatus: detectRemoteStatus(location),
    url: input.url,
    postedAt: input.postedAt ?? null,
    raw: input.raw,
  };
}

export function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
