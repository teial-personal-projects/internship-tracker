import type { AtsType } from '@internship-tracker/shared';
import sourceRows from './radarSources.backup.json';

type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';
type SourceAdapterType = AtsType | null;
type TrustedSourceAdapterType = string | null;

interface BackupRadarSourceRow {
  id: string;
  source_name: string;
  source_tier: SourceTier;
  adapter_type: SourceAdapterType;
  supports_direct_validity_checks: boolean;
  metadata?: {
    trusted_discovery_enabled?: boolean;
    trusted_source_adapter?: TrustedSourceAdapterType;
    feed_urls?: string[];
    attribution_text?: string;
  };
}

export interface RadarSourceMetadata {
  id: string;
  name: string;
  tier: SourceTier;
  adapterType: SourceAdapterType;
  supportsDirectValidityChecks: boolean;
  trustedDiscoveryEnabled: boolean;
  trustedSourceAdapter: TrustedSourceAdapterType;
  feedUrls: string[];
  attributionText: string | null;
}

function toSourceMetadata(row: BackupRadarSourceRow): RadarSourceMetadata {
  return {
    id: row.id,
    name: row.source_name,
    tier: row.source_tier,
    adapterType: row.adapter_type,
    supportsDirectValidityChecks: row.supports_direct_validity_checks,
    trustedDiscoveryEnabled: row.metadata?.trusted_discovery_enabled ?? false,
    trustedSourceAdapter: row.metadata?.trusted_source_adapter ?? null,
    feedUrls: row.metadata?.feed_urls ?? [],
    attributionText: row.metadata?.attribution_text ?? null,
  };
}

export const RADAR_SOURCE_REGISTRY: Record<string, RadarSourceMetadata> = Object.fromEntries(
  (sourceRows as BackupRadarSourceRow[]).map((row) => [row.id, toSourceMetadata(row)]),
);

export function getRadarSourceMetadata(sourceId: string): RadarSourceMetadata | null {
  return RADAR_SOURCE_REGISTRY[sourceId] ?? null;
}

export function getAtsSourceMetadata(atsType: AtsType): RadarSourceMetadata {
  return RADAR_SOURCE_REGISTRY[atsType];
}
