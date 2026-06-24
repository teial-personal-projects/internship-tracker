export type RemoteStatus = 'remote_us' | 'la' | 'onsite' | 'unknown';

export interface NormalizedPosting {
  externalId: string;
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

export interface AtsAdapter {
  fetch(boardToken: string): Promise<NormalizedPosting[]>;
}
