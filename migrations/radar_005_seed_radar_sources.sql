-- radar_005_seed_radar_sources.sql
-- Seeds the default global Radar source metadata.
-- Requires: radar_004_radar_sources.sql

-- ============================================================
-- UP
-- ============================================================

INSERT INTO radar_sources (
  id,
  source_name,
  source_tier,
  adapter_type,
  supports_direct_validity_checks
) VALUES
  ('greenhouse', 'Greenhouse', 'direct_ats', 'greenhouse', true),
  ('lever', 'Lever', 'direct_ats', 'lever', true),
  ('ashby', 'Ashby', 'direct_ats', 'ashby', true),
  ('smartrecruiters', 'SmartRecruiters', 'direct_ats', 'smartrecruiters', true),
  ('pinpoint', 'Pinpoint', 'direct_ats', 'pinpoint', false),
  ('welcomekit', 'Welcome Kit', 'direct_ats', 'welcomekit', false),
  ('custom', 'Custom careers page', 'direct_ats', 'custom', false),
  ('linkedin', 'LinkedIn', 'curated_board', null, false),
  ('we_work_remotely', 'We Work Remotely', 'curated_board', null, false),
  ('working_nomads', 'Working Nomads', 'curated_board', null, false),
  ('remote_co', 'Remote.co', 'curated_board', null, false),
  ('idealist', 'Idealist', 'curated_board', null, false),
  ('indeed', 'Indeed', 'aggregator', null, false),
  ('ziprecruiter', 'ZipRecruiter', 'aggregator', null, false)
ON CONFLICT (id) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_tier = EXCLUDED.source_tier,
  adapter_type = EXCLUDED.adapter_type,
  supports_direct_validity_checks = EXCLUDED.supports_direct_validity_checks,
  is_active = true,
  updated_at = now();

UPDATE radar_sources
SET
  metadata = metadata || jsonb_build_object(
    'trusted_discovery_enabled', true,
    'trusted_source_adapter', 'we_work_remotely',
    'feed_urls', jsonb_build_array(
      'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-programming-jobs.rss'
    ),
    'attribution_text', 'Jobs from We Work Remotely link back to the original WWR posting.'
  ),
  updated_at = now()
WHERE id = 'we_work_remotely';

-- ============================================================
-- DOWN
-- ============================================================

DELETE FROM radar_sources
WHERE id IN (
  'greenhouse',
  'lever',
  'ashby',
  'smartrecruiters',
  'pinpoint',
  'welcomekit',
  'custom',
  'linkedin',
  'we_work_remotely',
  'working_nomads',
  'remote_co',
  'idealist',
  'indeed',
  'ziprecruiter'
);
