import type { NormalizedPosting } from '../adapters/types';
import type { MatchCriteria } from '../match';

export interface TrustedSourceDefinition {
  id: string;
  name: string;
  tier: 'curated_board' | 'aggregator';
  adapterType: string;
  feedUrls: string[];
  attributionText?: string | null;
}

export interface TrustedSourceAdapter {
  search(source: TrustedSourceDefinition, criteria: MatchCriteria): Promise<NormalizedPosting[]>;
}

export interface TrustedSourceSearchResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  matched: number;
  inserted: number;
  error: string | null;
}
