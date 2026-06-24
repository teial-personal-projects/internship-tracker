export type RemoteStatus = 'remote_us' | 'la' | 'onsite' | 'unknown';

export interface NormalizedPosting {
  externalId: string;
  companyName?: string;
  title: string;
  location: string | null;
  remoteStatus: RemoteStatus;
  url: string;
  sourceName?: string;
  sourceTier?: 'direct_ats' | 'curated_board' | 'aggregator';
  canonicalUrl?: string;
  companyDomain?: string;
  postedAt: string | null;
  raw: unknown;
}

export interface PostingValidationInput extends NormalizedPosting {
  boardToken: string;
}

export interface PostingValidationResult {
  status: 'live' | 'closed' | 'not_found' | 'error';
  error?: string | null;
}

export interface AtsAdapter {
  fetch(boardToken: string): Promise<NormalizedPosting[]>;
  validate?(posting: PostingValidationInput): Promise<PostingValidationResult>;
}
