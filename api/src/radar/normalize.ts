import type { RemoteStatus } from './adapters/types';

const LA_TERMS = [
  'los angeles',
  'la,',
  'la ',
  'ca - los angeles',
  'california - los angeles',
];

const REMOTE_TERMS = [
  'remote',
  'work from home',
  'wfh',
  'distributed',
];

const US_TERMS = [
  'united states',
  'usa',
  'u.s.',
  'us ',
  'us-',
  'remote-us',
  'remote us',
  'remote, us',
  'remote (us',
  'remote - us',
  'remote within the us',
  'remote within united states',
];

const NON_US_REMOTE_TERMS = [
  'canada',
  'emea',
  'europe',
  'uk',
  'united kingdom',
  'india',
  'australia',
];

export function normalizeLocation(location: string | null | undefined): string | null {
  const normalized = location?.replace(/\s+/g, ' ').trim() ?? '';
  return normalized || null;
}

export function detectRemoteStatus(location: string | null | undefined): RemoteStatus {
  const normalizedLocation = normalizeLocation(location);
  if (!normalizedLocation) return 'unknown';

  const value = ` ${normalizedLocation.toLowerCase()} `;
  const isRemote = REMOTE_TERMS.some((term) => value.includes(term));
  const isLosAngeles = LA_TERMS.some((term) => value.includes(term));

  if (isLosAngeles) return 'la';
  if (!isRemote) return 'onsite';

  const isNonUsRemote = NON_US_REMOTE_TERMS.some((term) => value.includes(term));
  if (isNonUsRemote) return 'unknown';

  const isUsRemote = US_TERMS.some((term) => value.includes(term));
  if (isUsRemote || value.includes(' remote ')) return 'remote_us';

  return 'unknown';
}
