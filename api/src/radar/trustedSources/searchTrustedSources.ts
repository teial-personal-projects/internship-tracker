import type { RadarCriteria } from '@internship-tracker/shared';
import { ingestRadarPostings, type RadarIngestionDb } from '../refreshRadarSource';
import { criteriaFromRow } from '../match';
import { RADAR_SOURCE_REGISTRY } from '../sources/registry';
import { getTrustedSourceAdapter } from './registry';
import type { TrustedSourceDefinition, TrustedSourceSearchResult } from './types';

type SourceTier = 'direct_ats' | 'curated_board' | 'aggregator';

type RadarSourceSearchRow = {
  id: string;
  source_name: string;
  source_tier: SourceTier;
  is_active?: boolean;
  metadata?: unknown;
};

function toQuery<T>(value: unknown): T {
  return value as T;
}

function rawObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isMissingRadarSourcesTable(error: { message: string } | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes('radar_sources') && (message.includes('schema') || message.includes('does not exist'));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function sourceFromDbRow(row: RadarSourceSearchRow): TrustedSourceDefinition | null {
  if (row.source_tier !== 'curated_board' && row.source_tier !== 'aggregator') return null;

  const metadata = rawObject(row.metadata);
  if (metadata.trusted_discovery_enabled !== true) return null;

  const adapterType = typeof metadata.trusted_source_adapter === 'string'
    ? metadata.trusted_source_adapter
    : null;
  if (!adapterType) return null;

  return {
    id: row.id,
    name: row.source_name,
    tier: row.source_tier,
    adapterType,
    feedUrls: stringArray(metadata.feed_urls),
    attributionText: typeof metadata.attribution_text === 'string' ? metadata.attribution_text : null,
  };
}

function fallbackSources(): TrustedSourceDefinition[] {
  return Object.values(RADAR_SOURCE_REGISTRY)
    .filter((source) =>
      source.trustedDiscoveryEnabled
      && source.trustedSourceAdapter
      && (source.tier === 'curated_board' || source.tier === 'aggregator'),
    )
    .map((source) => ({
      id: source.id,
      name: source.name,
      tier: source.tier as 'curated_board' | 'aggregator',
      adapterType: source.trustedSourceAdapter as string,
      feedUrls: source.feedUrls,
      attributionText: source.attributionText,
    }));
}

async function getTrustedSources(db: RadarIngestionDb): Promise<TrustedSourceDefinition[]> {
  const query = toQuery<{
    select(columns?: string): unknown;
    eq(column: string, value: boolean): unknown;
  }>(db.from('radar_sources'));

  const result = await toQuery<Promise<{ data: RadarSourceSearchRow[] | null; error: { message: string } | null }>>(
    toQuery<{ eq(column: string, value: boolean): unknown }>(
      query.select('id, source_name, source_tier, is_active, metadata'),
    ).eq('is_active', true),
  );

  if (result.error) {
    if (isMissingRadarSourcesTable(result.error)) return fallbackSources();
    throw new Error(result.error.message);
  }

  const sources = (result.data ?? []).map(sourceFromDbRow).filter((source): source is TrustedSourceDefinition => source !== null);
  return sources.length > 0 ? sources : fallbackSources();
}

export async function searchTrustedSources(
  db: RadarIngestionDb,
  userId: string,
  criteriaRow: RadarCriteria,
): Promise<TrustedSourceSearchResult[]> {
  const criteria = criteriaFromRow(criteriaRow);
  const sources = await getTrustedSources(db);
  const results: TrustedSourceSearchResult[] = [];

  for (const source of sources) {
    try {
      const adapter = getTrustedSourceAdapter(source.adapterType);
      const postings = await adapter.search(source, criteria);
      const ingestion = await ingestRadarPostings(db, {
        id: source.id,
        user_id: userId,
        ats_type: null,
        ats_board_token: null,
        radar_enabled: true,
        source_tier: source.tier,
        source_name: source.name,
        radar_source_id: source.id,
      }, postings, criteria);

      results.push({
        sourceId: source.id,
        sourceName: source.name,
        fetched: ingestion.fetched,
        matched: ingestion.matched,
        inserted: ingestion.inserted,
        error: ingestion.error,
      });
    } catch (error) {
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        fetched: 0,
        matched: 0,
        inserted: 0,
        error: error instanceof Error ? error.message : 'Trusted source search failed',
      });
    }
  }

  return results;
}
