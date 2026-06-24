type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';
type ValidityStatus = 'unchecked' | 'live' | 'closed' | 'not_found' | 'stale' | 'error';

interface QualityPosting {
  source_tier?: SourceTier | null;
  validity_status?: ValidityStatus | null;
  first_seen_at?: string | null;
  also_seen_on?: unknown;
}

function sourceTierScore(tier: SourceTier): number {
  if (tier === 'curated_board') return 100;
  if (tier === 'direct_ats') return 55;
  return 10;
}

function validityScore(status: ValidityStatus): number {
  if (status === 'live') return 45;
  if (status === 'unchecked') return -5;
  if (status === 'stale') return -15;
  if (status === 'error') return -20;
  return -100;
}

function recencyScore(firstSeenAt: string | null | undefined): number {
  if (!firstSeenAt) return 0;

  const timestamp = new Date(firstSeenAt).getTime();
  if (Number.isNaN(timestamp)) return 0;

  const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  return Math.max(0, 30 - ageDays);
}

function hasDirectCorroboration(value: unknown): boolean {
  if (!Array.isArray(value)) return false;

  return value.some((entry) =>
    entry
    && typeof entry === 'object'
    && (entry as { source_tier?: unknown }).source_tier === 'direct_ats',
  );
}

export function qualityScore(posting: QualityPosting): number {
  const tier = posting.source_tier ?? 'direct_ats';
  const validity = posting.validity_status ?? 'unchecked';
  const corroboration = tier === 'aggregator' && hasDirectCorroboration(posting.also_seen_on) ? 35 : 0;

  return sourceTierScore(tier)
    + validityScore(validity)
    + recencyScore(posting.first_seen_at)
    + corroboration;
}
