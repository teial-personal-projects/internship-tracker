import type { AtsType } from '@internship-tracker/shared';
import sourceRows from './radarSources.backup.json';

type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';
type SourceAdapterType = AtsType | null;

interface BackupRadarSourceRow {
  id: string;
  source_name: string;
  source_tier: SourceTier;
  adapter_type: SourceAdapterType;
  supports_direct_validity_checks: boolean;
}

export interface RadarSourceMetadata {
  id: string;
  name: string;
  tier: SourceTier;
  adapterType: SourceAdapterType;
  supportsDirectValidityChecks: boolean;
}

function toSourceMetadata(row: BackupRadarSourceRow): RadarSourceMetadata {
  return {
    id: row.id,
    name: row.source_name,
    tier: row.source_tier,
    adapterType: row.adapter_type,
    supportsDirectValidityChecks: row.supports_direct_validity_checks,
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
