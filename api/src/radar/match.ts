import type { NormalizedPosting } from './adapters/types';

export interface MatchCriteria {
  seniorityTerms: string[];
  excludedTerms: string[];
  allowedRemoteStatuses: Array<NormalizedPosting['remoteStatus']>;
}

export const MVP_MATCH_CRITERIA: MatchCriteria = {
  seniorityTerms: ['senior', 'staff', 'principal'],
  excludedTerms: ['junior', 'intern', 'internship'],
  allowedRemoteStatuses: ['remote_us', 'la'],
};

export function matches(
  posting: NormalizedPosting,
  criteria: MatchCriteria = MVP_MATCH_CRITERIA,
): boolean {
  const title = posting.title.toLowerCase();
  const hasSeniority = criteria.seniorityTerms.some((term) => title.includes(term));
  const isExcluded = criteria.excludedTerms.some((term) => title.includes(term));
  const isAllowedLocation = criteria.allowedRemoteStatuses.includes(posting.remoteStatus);

  return hasSeniority && !isExcluded && isAllowedLocation;
}
