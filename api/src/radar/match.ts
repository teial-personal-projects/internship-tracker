import type { NormalizedPosting } from './adapters/types';
import type { RadarCriteria } from '@internship-tracker/shared';

export interface MatchCriteria {
  titleTerms: string[];
  fieldTerms: string[];
  includeKeywords: string[];
  excludedTerms: string[];
  allowedRemoteStatuses: Array<NormalizedPosting['remoteStatus']>;
}

export const MVP_MATCH_CRITERIA: MatchCriteria = {
  titleTerms: ['software engineer', 'backend engineer', 'full-stack engineer', 'full stack engineer'],
  fieldTerms: ['edtech', 'education technology', 'mission-driven', 'civic tech', 'nonprofit tech'],
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

  const titleTerms = Array.isArray(row.title_terms) ? row.title_terms : [];
  const fieldTerms = Array.isArray(row.field_terms) ? row.field_terms : [];
  const seniorityTerms = Array.isArray(row.seniority_terms) ? row.seniority_terms : [];
  const includeKeywords = Array.isArray(row.include_keywords) ? row.include_keywords : [];
  const excludeKeywords = Array.isArray(row.exclude_keywords) ? row.exclude_keywords : [];
  const locationRules = (Array.isArray(row.location_rules) ? row.location_rules : []).filter((rule) =>
    ['remote_us', 'la', 'onsite', 'unknown'].includes(rule),
  ) as MatchCriteria['allowedRemoteStatuses'];
  const legacyTitleTerms = seniorityTerms.length > 0
    ? seniorityTerms.map((term) => `${term} engineer`)
    : [];

  return {
    titleTerms: mergeTerms(titleTerms.length > 0 ? titleTerms : legacyTitleTerms, MVP_MATCH_CRITERIA.titleTerms),
    fieldTerms: mergeTerms(fieldTerms, MVP_MATCH_CRITERIA.fieldTerms),
    includeKeywords: normalizeTerms(includeKeywords),
    excludedTerms: mergeTerms(excludeKeywords, MVP_MATCH_CRITERIA.excludedTerms),
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
  const hasTargetTitle = criteria.titleTerms.some((term) => title.includes(term));
  const hasIncludeKeywords = criteria.includeKeywords.length === 0
    || criteria.includeKeywords.some((term) => title.includes(term));
  const isExcluded = criteria.excludedTerms.some((term) => title.includes(term));
  const isAllowedLocation = criteria.allowedRemoteStatuses.includes(posting.remoteStatus);

  return hasTargetTitle && hasIncludeKeywords && !isExcluded && isAllowedLocation;
}
