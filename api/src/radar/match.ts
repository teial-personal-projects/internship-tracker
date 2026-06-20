import type { NormalizedPosting } from './adapters/types';
import type { RadarCriteria } from '@internship-tracker/shared';

export interface MatchCriteria {
  seniorityTerms: string[];
  includeKeywords: string[];
  excludedTerms: string[];
  allowedRemoteStatuses: Array<NormalizedPosting['remoteStatus']>;
}

export const MVP_MATCH_CRITERIA: MatchCriteria = {
  seniorityTerms: ['senior', 'staff', 'principal'],
  includeKeywords: [],
  excludedTerms: ['junior', 'intern', 'internship'],
  allowedRemoteStatuses: ['remote_us', 'la'],
};

function normalizeTerms(terms: string[]): string[] {
  return terms.map((term) => term.trim().toLowerCase()).filter(Boolean);
}

function mergeTerms(configured: string[], defaults: string[]): string[] {
  const normalized = normalizeTerms(configured);
  return normalized.length > 0 ? normalized : defaults;
}

export function criteriaFromRow(row: RadarCriteria | null | undefined): MatchCriteria {
  if (!row) return MVP_MATCH_CRITERIA;

  const locationRules = row.location_rules.filter((rule) =>
    ['remote_us', 'la', 'onsite', 'unknown'].includes(rule),
  ) as MatchCriteria['allowedRemoteStatuses'];

  return {
    seniorityTerms: mergeTerms(row.seniority_terms, MVP_MATCH_CRITERIA.seniorityTerms),
    includeKeywords: normalizeTerms(row.include_keywords),
    excludedTerms: mergeTerms(row.exclude_keywords, MVP_MATCH_CRITERIA.excludedTerms),
    allowedRemoteStatuses: locationRules.length > 0
      ? locationRules
      : MVP_MATCH_CRITERIA.allowedRemoteStatuses,
  };
}

export function matches(
  posting: NormalizedPosting,
  criteria: MatchCriteria = MVP_MATCH_CRITERIA,
): boolean {
  const title = posting.title.toLowerCase();
  const hasSeniority = criteria.seniorityTerms.some((term) => title.includes(term));
  const hasIncludeKeywords = criteria.includeKeywords.length === 0
    || criteria.includeKeywords.some((term) => title.includes(term));
  const isExcluded = criteria.excludedTerms.some((term) => title.includes(term));
  const isAllowedLocation = criteria.allowedRemoteStatuses.includes(posting.remoteStatus);

  return hasSeniority && hasIncludeKeywords && !isExcluded && isAllowedLocation;
}
