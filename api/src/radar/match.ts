import type { NormalizedPosting } from './adapters/types';
import type { RadarCriteria } from '@internship-tracker/shared';

export interface MatchCriteria {
  titleTerms: string[];
  fieldTerms: string[];
  includeKeywords: string[];
  excludedTerms: string[];
  locationTerms: string[];
  allowedRemoteStatuses: Array<NormalizedPosting['remoteStatus']>;
}

export const MVP_MATCH_CRITERIA: MatchCriteria = {
  titleTerms: [],
  fieldTerms: [],
  includeKeywords: [],
  excludedTerms: [],
  locationTerms: [],
  allowedRemoteStatuses: [],
};

function normalizeTerms(terms: string[]): string[] {
  return terms.map((term) => term.trim().toLowerCase()).filter(Boolean);
}

export function criteriaFromRow(row: RadarCriteria | null | undefined): MatchCriteria {
  if (!row) return MVP_MATCH_CRITERIA;

  const titleTerms = Array.isArray(row.title_terms) ? row.title_terms : [];
  const fieldTerms = Array.isArray(row.field_terms) ? row.field_terms : [];
  const seniorityTerms = Array.isArray(row.seniority_terms) ? row.seniority_terms : [];
  const includeKeywords = Array.isArray(row.include_keywords) ? row.include_keywords : [];
  const excludeKeywords = Array.isArray(row.exclude_keywords) ? row.exclude_keywords : [];
  const locationTerms = Array.isArray(row.location_terms) ? row.location_terms : [];
  const locationRules = (Array.isArray(row.location_rules) ? row.location_rules : []).filter((rule) =>
    ['remote_us', 'onsite'].includes(rule),
  ) as MatchCriteria['allowedRemoteStatuses'];
  const legacyTitleTerms = seniorityTerms.length > 0
    ? seniorityTerms.map((term) => `${term} engineer`)
    : [];

  return {
    titleTerms: normalizeTerms(titleTerms.length > 0 ? titleTerms : legacyTitleTerms),
    fieldTerms: normalizeTerms(fieldTerms),
    includeKeywords: normalizeTerms(includeKeywords),
    excludedTerms: normalizeTerms(excludeKeywords),
    locationTerms: normalizeTerms(locationTerms),
    allowedRemoteStatuses: locationRules,
  };
}

export function matches(
  posting: NormalizedPosting,
  criteria: MatchCriteria = MVP_MATCH_CRITERIA,
): boolean {
  const title = posting.title.toLowerCase();
  const hasSearchAnchor = criteria.titleTerms.length > 0
    || criteria.locationTerms.length > 0
    || criteria.allowedRemoteStatuses.length > 0;
  if (!hasSearchAnchor) return false;

  const hasTargetTitle = criteria.titleTerms.length === 0
    || criteria.titleTerms.some((term) => title.includes(term));
  const hasIncludeKeywords = criteria.includeKeywords.length === 0
    || criteria.includeKeywords.some((term) => title.includes(term));
  const isExcluded = criteria.excludedTerms.some((term) => title.includes(term));
  const location = (posting.location ?? '').toLowerCase();
  const hasLocationCriteria = criteria.allowedRemoteStatuses.length > 0 || criteria.locationTerms.length > 0;
  const isAllowedLocation = !hasLocationCriteria
    || criteria.allowedRemoteStatuses.includes(posting.remoteStatus)
    || criteria.locationTerms.some((term) => location.includes(term));

  return hasTargetTitle && hasIncludeKeywords && !isExcluded && isAllowedLocation;
}
