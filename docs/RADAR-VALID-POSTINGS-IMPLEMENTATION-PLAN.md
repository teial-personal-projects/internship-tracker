# Job Radar Valid Posting Implementation Plan

**Status:** Deferred to V3
**Last updated:** June 24, 2026
**Scope:** V3-only planning for Job Discovery. This feature is no longer part of the V2 release. The initial V3 implementation should avoid paid provider APIs and broad scraping; direct ATS refreshes for user-selected companies or free documented sources are preferred starting points.

## Product Direction

Radar is a V3 trusted job discovery surface, not an application tracker. It should normalize postings into a stable shape, rank credible software engineering openings that match the user's title, field, location, and exclusion criteria, and preserve links to original postings. It should not create Applications records or require the user to track a role.

The Companies To Watch list is a separate support tool: it stores companies the user already knows they want to keep checking. Direct ATS adapters can remain there for company-specific careers refreshes, but they are not the primary Radar discovery strategy. Broad job search must not read from, dedupe against, or otherwise depend on Companies To Watch. A user-initiated Save company action may create or update a watchlist row from a Radar result, but that save is a one-way action from discovery into watchlist monitoring.

Trusted job sources should be curated deliberately. Prefer user-configured direct ATS sources, official feeds, explicit export formats, and sources with consistently real postings. Paid provider APIs should not be required for the initial V3 implementation. LinkedIn-style repeat feeds and low-quality aggregators are mostly confirmation signals and should not be allowed to clutter the workflow.

No cron jobs, scheduled jobs, auto-refresh loops, or other automated background polling should be added for this pass. Search, refresh, and validation should happen only from explicit user actions.

## Source Tiers

| Tier | Source class | Examples | Product behavior |
| --- | --- | --- | --- |
| 1 | User-selected direct ATS | Greenhouse, Lever, Ashby, SmartRecruiters | Primary starting point when the user already knows the company and source configuration |
| 2 | Free documented feeds | Official RSS, public exports, explicit no-scrape APIs | Optional broader discovery only when the source is free and stable |
| 3 | Confirmation aggregators | Indeed, ZipRecruiter-style syndication, LinkedIn-style repeat feeds | Append as `also_seen_on` instead of creating noise |

## Step 1 — Data Model

1.1 [x] Create a migration such as `migrations/radar_003_source_tiers.sql`.
1.2 [x] Add `source_tier_enum` with values `direct_ats`, `curated_board`, and `aggregator`.
1.3 [x] Add `posting_validity_status_enum` with values `unchecked`, `live`, `closed`, `not_found`, `stale`, and `error`.
1.4 [x] Add `source_tier source_tier_enum NOT NULL DEFAULT 'direct_ats'` to `company_watchlist`.
1.5 [x] Add `source_name TEXT` to `company_watchlist` for direct source labels and custom direct ATS setup context.
1.6 [x] Add `source_tier source_tier_enum NOT NULL DEFAULT 'direct_ats'` to `discovered_postings`.
1.7 [x] Add `first_seen_source TEXT NOT NULL DEFAULT 'radar'` to `discovered_postings`.
1.8 [x] Add `also_seen_on JSONB NOT NULL DEFAULT '[]'::jsonb` to `discovered_postings`.
1.9 [x] Add `source_first_seen_at JSONB NOT NULL DEFAULT '{}'::jsonb` to `discovered_postings`.
1.10 [x] Add `validity_status posting_validity_status_enum NOT NULL DEFAULT 'unchecked'` to `discovered_postings`.
1.11 [x] Add `last_validated_at TIMESTAMPTZ` to `discovered_postings`.
1.12 [x] Add `validation_error TEXT` to `discovered_postings`.
1.13 [x] Add indexes on `discovered_postings(user_id, source_tier, first_seen_at DESC)` and `discovered_postings(user_id, validity_status)`.
1.14 [x] Update `migrations/prod_full_v2_schema.sql` with the complete schema changes so a fresh database does not require replaying the migration chain.
1.15 [x] Update any schema audit scripts that check Radar columns, enums, tables, or indexes.
1.16 [x] Make `discovered_postings.watchlist_id` nullable so source-discovered jobs can exist without a watchlist row.
1.17 [x] Add `radar_source_id TEXT REFERENCES radar_sources(id)` to `discovered_postings` for source-discovered postings.
1.18 [x] Add indexes on `discovered_postings(user_id, radar_source_id, first_seen_at DESC)` and keep the existing watchlist index for separate company-specific refreshes.
1.19 [x] Add a partial unique index on `(user_id, radar_source_id, external_job_id)` for source-discovered postings.
1.20 [x] Update the consolidated `migrations/feature_migration.sql` with the nullable watchlist and `radar_source_id` changes.

## Step 2 — Shared Schemas

2.1 [x] Add `SourceTierSchema` and `PostingValidityStatusSchema` in `shared/src/schemas.ts`.
2.2 [x] Extend `RadarSourceSchema` with `source_tier` and `source_name`.
2.3 [x] Extend `DiscoveredPostingSchema` with provenance and validity fields.
2.4 [x] Export inferred `SourceTier` and `PostingValidityStatus` types.
2.5 [x] Run shared package type checks.
2.6 [x] Make `DiscoveredPostingSchema.watchlist_id` nullable.
2.7 [x] Add `radar_source_id` to `DiscoveredPostingSchema`.

## Step 3 — Source Configuration

3.1 [x] Add a source tier selector to company-specific source configuration.
3.2 [x] Default existing ATS-backed company-specific rows to `direct_ats`.
3.3 [x] Keep ATS adapter fields visible only when `source_tier = direct_ats`.
3.4 [x] Add source setup copy that explains direct ATS, curated board, and aggregator behavior in operational terms.
3.5 [x] Create `radar_sources` table with a JSON-backed `api/src/radar/sources/registry.ts` fallback.
3.6 [x] Define known source metadata in database seed data: source name, tier, adapter type, and whether the source supports direct validity checks.
3.7 [x] Map current ATS adapters to `direct_ats`.
3.8 [x] Reserve curated-board entries for future adapters without wiring broad scraping into the first release.
3.9 [x] Treat `radar_sources` as the catalog of trusted job-search sources.
3.10 [x] Add source metadata fields needed for manual search, such as supported query fields, feed URL template, attribution text, and whether the source is enabled for trusted discovery.
3.11 [x] Keep company source settings only for company-specific direct ATS refreshes.
3.12 [x] Choose curated-board sources by first evaluating whether they expose safe searchable APIs, RSS feeds, documented exports, or equivalent explicit integration paths.

## Step 4 — Watchlist Separation

4.1 [ ] Keep broad Radar search independent from `company_watchlist`.
4.2 [ ] Do not read watched-company names, industries, or ATS settings when running provider-backed Radar search.
4.3 [ ] Do not dedupe provider-backed Radar results against Companies To Watch rows.
4.4 [ ] Add a user-initiated `Save company` action on Radar postings.
4.5 [ ] Save only company-level watchlist context from Radar, not an application record.
4.6 [ ] Preserve useful source context on saved watchlist rows, such as the provider name, posting URL, and inferred company name.
4.7 [ ] Show watchlist saved state on Radar postings when the company has already been saved.
4.8 [ ] Do not create Applications records from Radar postings.

## Step 5 — Provenance-Aware Ingestion

5.1 [x] Extend `NormalizedPosting` in `api/src/radar/adapters/types.ts` with `sourceName`, `sourceTier`, optional `canonicalUrl`, and optional `companyDomain`.
5.2 [x] Create `api/src/radar/fingerprint.ts`.
5.3 [x] Normalize title by lowercasing, stripping seniority punctuation noise, and trimming whitespace.
5.4 [x] Normalize company name and URL host.
5.5 [x] Produce a deterministic fingerprint from company, normalized title, and canonical URL or external ID.
5.6 [x] Keep exact `(watchlist_id, external_job_id)` dedupe in `refreshRadarSource`.
5.7 [x] Before insert, look for an existing posting with the same canonical fingerprint for the same user and company.
5.8 [x] If a fingerprint match exists, append the new source to `also_seen_on` instead of inserting a duplicate card.
5.9 [x] Preserve the original `first_seen_at` and `first_seen_source`.
5.10 [x] Add or update `source_first_seen_at[sourceName]`.
5.11 [x] Resolve source metadata from `radar_sources`, falling back to `api/src/radar/sources/registry.ts` when the catalog query is unavailable.
5.12 [x] Store `discovered_postings.source_tier` as a denormalized copy of the authoritative `radar_sources.source_tier` value for filters and quality sorting.
5.13 [x] Preserve the highest-authority canonical source tier, using `direct_ats` over `curated_board` over `aggregator`.
5.14 [x] If a higher-authority job-board source later matches an existing job-board fingerprint, update the posting's denormalized `source_tier` and primary source fields without changing `first_seen_at`.
5.15 [x] Do not model curated boards or aggregators as company-specific watchlist source rows.

## Step 6 — Validity Checks

6.1 [x] Extend `AtsAdapter` in `api/src/radar/adapters/types.ts` with optional `validate?(posting: NormalizedPosting): Promise<PostingValidationResult>`.
6.2 [x] Implement validation for Greenhouse, Lever, Ashby, and SmartRecruiters by checking whether the external job ID still appears in the current board response.
6.3 [x] Treat network errors as `error`, not `closed`.
6.4 [x] Treat missing jobs from a successful board response as `closed`.
6.5 [x] Recheck validity only from explicit user actions, such as opening or saving a posting, when the current validity state is stale enough to be useful.
6.6 [x] If validation returns `closed` or `not_found`, update the posting row and show the closed state on the card.
6.7 [x] If validation errors, keep the posting visible and allow the user to open the source posting.
6.8 [x] Store `last_validated_at`, `validity_status`, and `validation_error`.
6.9 [x] Defer manual validity overrides for this pass.
6.10 [x] If overrides are added later, scope them to system-closed states only and record a user assertion separately from system validation.

## Step 7 — Ranking and API Filters

7.1 [x] Create `api/src/radar/qualityScore.ts`.
7.2 [ ] Score enabled direct-source and free documented-feed postings highest for general discovery.
7.3 [x] Score recently first-seen postings higher.
7.4 [x] Score validated-live postings higher.
7.5 [ ] Penalize low-quality confirmation aggregators unless they corroborate a provider or direct ATS posting.
7.6 [x] Penalize stale or unchecked postings.
7.7 [x] Add `source_tier` filter to `GET /api/radar/postings`.
7.8 [x] Add `validity_status` filter to `GET /api/radar/postings`.
7.9 [x] Add `sort=quality|first_seen|posted_at` to `GET /api/radar/postings`.
7.10 [x] Default to quality sort for `status=new`.
7.11 [x] Exclude `closed` and `not_found` postings from the default fresh direct matches query.
7.12 [x] Keep closed postings available through `All` and `Closed` filters.
7.13 [x] Hide closed postings from the default view when `last_validated_at` is older than about two weeks, without deleting the row.
7.14 [x] Support Radar search across posting title, company name, and location.

## Step 8 — Discover and Watchlist UI

8.1 [x] Use the company-grouped Radar layout as the target Discover view.
8.2 [x] Keep source tier filters available for quick triage: `Fresh direct matches`, `Curated`, `Aggregator`, `Live only`, and `All`.
8.3 [x] Make the job title and primary posting action open the original posting URL.
8.4 [x] Show a compact source badge: `Direct ATS`, `Curated`, or `Aggregator`.
8.5 [x] Show validity state: `Live`, `Unchecked`, `Closed`, `Validation failed`, or `Stale`.
8.6 [x] Show `First seen from Greenhouse` or the relevant source name.
8.7 [x] Show `Also seen on LinkedIn` only as supporting context, not as a separate card.
8.8 [ ] Make `Open posting` and `Save company` the primary Radar card actions.
8.9 [x] Keep closed postings visible with a closed state, but do not present them as fresh matches.
8.10 [x] Remove application-tracking actions from the Discover and Watchlist UI.
8.11 [x] Avoid bulky explanatory hero cards or tutorial panels that push job content down the page.
8.12 [x] Use the spatial three-column tier view only if curated and aggregator sources become substantial enough to compare side by side.
8.13 [x] Collapse closed postings under their company group instead of rendering them as equally prominent fresh cards.
8.14 [x] Do not add a general manual validity toggle to Radar cards in this pass.
8.15 [x] Label Radar search so it is clear that title, company, and industry terms are searchable.

## Step 9 — Radar Search Criteria

9.1 [x] Add editable Radar search criteria for target titles, fields or industries, locations, and exclusion terms.
9.2 [x] Seed sensible default title terms such as `software engineer`, `backend engineer`, and `full-stack engineer`.
9.3 [x] Seed field or industry terms oriented around the user's targets, such as `edtech`, `education technology`, `mission-driven`, `civic tech`, and `nonprofit tech`.
9.4 [x] Keep criteria user-editable and persist them in `radar_criteria` or a follow-on criteria table.
9.5 [ ] Add a manual `Search providers` action.
9.6 [x] Do not run source searches automatically or on a timer.
9.7 [x] Show why a posting matched, such as title term, field term, source, and location rule.
9.8 [x] Keep job-board search visually and behaviorally separate from Companies To Watch.

## Step 10 — Provider Search

10.1 [ ] Define a `RadarProviderAdapter` contract for source searches that accepts criteria and returns `NormalizedPosting[]`.
10.2 [x] Support source-discovered postings that are not associated with a watchlist row.
10.3 [x] Insert source-discovered postings with `radar_source_id`, `sourceName`, `sourceTier`, provenance fields, and nullable `watchlist_id`.
10.4 [x] Reuse fingerprint dedupe only among job-board source-discovered roles, not against watchlist-discovered roles.
10.5 [ ] Allow discovered job-board companies to be saved to `company_watchlist` only from the explicit `Save company` action.
10.6 [ ] Build the first source adapter from a free documented source or user-selected direct ATS source.
10.7 [ ] Prefer sources with official RSS feeds, documented APIs, or explicit export formats.
10.8 [x] Avoid sources that require broad scraping, anti-bot bypassing, paid access, or produce mostly LinkedIn-style duplicate noise.
10.9 [ ] Do not ship an additional provider adapter until the source is explicitly selected for the user's target search.
10.10 [x] Keep Idealist as a high-value follow-up only if a safe, non-scraping integration path is chosen.
10.11 [ ] Treat direct ATS adapters as company-specific refresh tools after a company is saved, not as the starting point for broad discovery.

## Step 11 — Initial Source Adapter

11.1 [ ] Introduce a provider interface that accepts Radar criteria and returns normalized postings.
11.2 [ ] Implement the first source adapter without requiring paid provider credentials.
11.3 [ ] Normalize provider results into `source`, `sourceJobId`, `title`, `company`, `location`, `postingUrl`, `description`, `postedAt`, `expiresAt`, and `rawPayload`.
11.4 [ ] Keep source-specific response parsing inside the provider adapter instead of leaking source fields into routes or UI components.
11.5 [ ] Store the normalized source fields on `discovered_postings` or map them to existing columns without losing `rawPayload`.
11.6 [ ] Require a stable provider job ID for dedupe; fall back to canonical posting URL only when a provider cannot supply an ID.
11.7 [ ] Keep the original posting URL as the primary outbound action.
11.8 [ ] Add provider-level error handling that reports unavailable, rate-limited, or malformed provider responses without deleting existing postings.
11.9 [ ] Document source configuration without requiring paid provider credentials.
11.10 [ ] Do not add background polling before manual source search is stable.

## Step 12 — Watchlist ATS Enrichment

12.1 [ ] After a company is saved from Radar, try known Greenhouse and Lever board identifiers when available.
12.2 [ ] Keep Greenhouse and Lever enrichment company-oriented, not broad discovery.
12.3 [ ] Store discovered ATS configuration on the watchlist row only after a successful company-specific lookup.
12.4 [ ] Refresh saved-company postings from Greenhouse or Lever only from explicit user actions.
12.5 [ ] If no ATS board is found, keep the saved company visible without marking enrichment as failed.
12.6 [ ] Prefer direct ATS postings over provider results when both match the same company and role fingerprint.
12.7 [ ] Never create an Applications record from Greenhouse or Lever enrichment.

## Step 13 — Optional Metrics

13.1 [ ] Calculate lead time between first provider sighting, direct ATS sighting, and later aggregator sightings.
13.2 [ ] Surface a compact metric only when it helps explain source quality, such as `Trusted sources found roles 2d before broad syndication`.
13.3 [ ] Hide metrics until there is enough data to avoid misleading averages.
13.4 [ ] Retain closed posting rows because their `source_first_seen_at` and `also_seen_on` history contributes to lead-time metrics.

## Step 14 — Tests

14.1 [x] Add `fingerprint.test.ts` coverage proving the same role from ATS and aggregator URLs produces the same canonical fingerprint.
14.2 [x] Add `refreshRadarSource.test.ts` coverage proving an existing posting appends `also_seen_on` instead of inserting a duplicate.
14.3 [x] Add `refreshRadarSource.test.ts` coverage proving the highest-authority source tier remains canonical after an aggregator sighting.
14.4 [x] Add `refreshRadarSource.test.ts` coverage proving a later direct ATS match can promote a curated or aggregator posting without changing `first_seen_at`.
14.5 [x] Add adapter tests proving validation marks missing jobs as closed after a successful board response.
14.6 [ ] Add route tests proving Radar job-board postings can save companies to the watchlist only from an explicit user action.
14.7 [ ] Add route tests proving quality sort returns enabled provider-backed live postings before low-quality aggregator unchecked postings.
14.8 [x] Add route tests proving old closed postings are hidden from the default view but returned by `All` or `Closed` filters.
14.9 [ ] Add source adapter tests with source-specific fixture data.
14.10 [x] Add route tests proving source-discovered postings can exist without a watchlist row.
14.11 [ ] Add route tests proving `Search providers` stores source-discovered postings with `radar_source_id`.
14.12 [x] Add frontend tests proving Radar cards render source tier badges and validity status.
14.13 [x] Add frontend tests proving Radar cards open the original posting from the title or primary action.
14.14 [ ] Add frontend tests proving Radar cards expose `Open posting` and `Save company` without exposing application-tracking actions.
14.15 [x] Add frontend tests proving closed postings are excluded from fresh-match presentation.
14.16 [x] Add frontend tests proving source tier and validity filters update API params.
14.17 [x] Add frontend tests proving `also_seen_on` displays as supporting provenance without rendering duplicate cards.
14.18 [x] Add frontend tests proving there is no general manual validity override control.
14.19 [ ] Add frontend tests proving saved-company state appears without making broad Radar search depend on watchlist controls.
14.20 [ ] Add Greenhouse and Lever enrichment tests for saved companies.

## Step 15 — Verification

15.1 [ ] Run backend tests relevant to Radar ingestion, routes, providers, and adapters.
15.2 [ ] Run frontend tests relevant to Discover and Watchlist.
15.3 [ ] Run shared, API, and web type checks.
15.4 [ ] Run the web build.
15.5 [ ] Run markdownlint on changed markdown files.
15.6 [ ] Manually verify the Discover route after signing in.
15.7 [ ] Manually verify the Watchlist section after signing in.

Manual UI verification note: the local app opened successfully at `http://127.0.0.1:5175/radar`, but the available browser profile was not signed in and redirected to the login screen. Complete 15.6 and 15.7 after signing in locally.

## Source Notes

1. [ ] Use the [Greenhouse Job Board API documentation](https://developers.greenhouse.io/job-board.html) for saved-company enrichment.
2. [ ] Use the [Lever developer documentation](https://hire.lever.co/developer/documentation) for saved-company enrichment.
3. [ ] Add any broader source documentation only after confirming the source is free, documented, and useful for the user's target roles.

## Non-Goals For This Pass

1. [ ] Do not add cron jobs, scheduled jobs, background polling, or automatic refresh loops.
2. [ ] Do not build broad aggregator scraping first.
3. [ ] Do not try to solve every Workday tenant.
4. [ ] Do not introduce paid board integrations.
5. [ ] Do not create Applications records from Radar postings.
6. [ ] Do not automatically create company watchlist rows from job-board postings.
7. [ ] Do not scrape Idealist or other curated boards that lack an official feed in this pass.
8. [ ] Do not add manual validity override UI until real closed-but-live false positives justify it.
9. [ ] Do not make broad provider search depend on Companies To Watch.
10. [ ] Do not prioritize a job source simply because it is easy to integrate if it does not help the user's target roles.

## Future Implementation

Future enhancements are intentionally out of scope for the current pass. They should not be implemented until the V3 manual discovery and saved-company enrichment paths are stable.

### Additional Discovery Providers

1.1 [ ] Evaluate paid providers only if free and direct-source discovery proves insufficient.
1.2 [ ] Add a paid provider only after a separate cost review and explicit approval.
1.3 [ ] Add niche boards, RSS feeds, and documented exports when they improve match quality for the user's target roles.
1.4 [ ] Keep each new provider behind the same normalized provider interface.
1.5 [ ] Add source-specific tests and fixtures before enabling a new provider in the UI.

## Resolved Decisions

1. [x] Keep `radar_sources` as the authoritative catalog for source names, tiers, adapter types, and validity-check support.
2. [x] Keep `company_watchlist.source_tier` as the default for company-specific direct ATS configuration only.
3. [x] Keep `discovered_postings.source_tier` as a denormalized query-time copy used by filters and quality sort.
4. [x] Do not add manual validity override UI in this pass.
5. [x] Keep closed discovered postings and demote or filter them at query time instead of hard-deleting them.
6. [x] Treat Companies To Watch as separate from broad provider search while allowing explicit company saves from Radar.
7. [x] Remove the We Work Remotely pilot adapter and do not search bundled fallback sources.
8. [x] Do not require a paid provider for the initial discovery implementation.
9. [x] Keep direct ATS adapters for saved-company refreshes instead of treating them as primary broad discovery sources.
