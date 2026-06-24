# Job Radar Valid Posting Implementation Plan

**Status:** Proposed
**Last updated:** June 23, 2026
**Scope:** Turn Job Radar into a trusted job-board discovery surface for high-signal software engineering roles, while keeping company watchlist refresh as a secondary input.

## Product Direction

Radar is a trusted job discovery surface, not an application tracker and not primarily a company watcher. Its job is to search curated, high-signal job sources for credible software engineering openings that match the user's title, field, location, and exclusion criteria. It should let the user click through to the original posting and optionally save the company to the Companies To Watch list. It should not create Applications records or require the user to track a role.

The Companies To Watch list is a separate support tool: it stores companies the user already knows they want to keep checking. Watchlist ATS refreshes can feed Radar, but they should not define the whole Radar experience.

Trusted job-board sources should be curated deliberately. Prefer niche boards, official feeds, APIs, and sources with consistently real postings. Broad aggregators and LinkedIn-style repeat feeds are mostly confirmation signals and should not be allowed to clutter the workflow.

No cron jobs, scheduled jobs, auto-refresh loops, or other automated background polling should be added for this pass. Search, refresh, and validation should happen only from explicit user actions.

## Source Tiers

| Tier | Source class | Examples | Product behavior |
| --- | --- | --- | --- |
| 1 | Direct ATS | Greenhouse, Lever, Ashby, Workday, SmartRecruiters | Highest-confidence original source, usually from watchlist or discovered company careers pages |
| 2 | Trusted curated boards | Wellfound-style niche boards, mission-driven boards, We Work Remotely, Working Nomads, Remote.co, Idealist if a safe integration exists | Primary discovery channels when they expose reliable feeds or APIs |
| 3 | Aggregators | Indeed, ZipRecruiter-style syndication | Append as `also_seen_on` instead of creating noise |

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
1.16 [x] Make `discovered_postings.watchlist_id` nullable so trusted source searches can discover jobs before the company is saved to the watchlist.
1.17 [x] Add `radar_source_id TEXT REFERENCES radar_sources(id)` to `discovered_postings` for source-discovered postings.
1.18 [x] Add indexes on `discovered_postings(user_id, radar_source_id, first_seen_at DESC)` and keep the existing watchlist index for company-watchlist refreshes.
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

3.1 [x] Add a source tier selector to the watchlist Radar configuration.
3.2 [x] Default existing ATS-backed watchlist rows to `direct_ats`.
3.3 [x] Keep ATS adapter fields visible only when `source_tier = direct_ats`.
3.4 [x] Add source setup copy that explains direct ATS, curated board, and aggregator behavior in operational terms.
3.5 [x] Create `radar_sources` table with a JSON-backed `api/src/radar/sources/registry.ts` fallback.
3.6 [x] Define known source metadata in database seed data: source name, tier, adapter type, and whether the source supports direct validity checks.
3.7 [x] Map current ATS adapters to `direct_ats`.
3.8 [x] Reserve curated-board entries for future adapters without wiring broad scraping into the first release.
3.9 [ ] Treat `radar_sources` as the catalog of trusted job-search sources, not merely metadata for watchlist refreshes.
3.10 [ ] Add source metadata fields needed for manual search, such as supported query fields, feed URL template, attribution text, and whether the source is enabled for trusted discovery.
3.11 [ ] Keep company watchlist source settings only for company-specific direct ATS refreshes.

## Step 4 — Save Company From Radar

4.1 [x] Add or update the backend flow for saving a Radar posting company to `company_watchlist`.
4.2 [x] Reuse the existing watchlist create/update behavior instead of creating an Application.
4.3 [x] Prevent duplicate watchlist rows for the same user and company.
4.4 [x] Preserve source context when useful, such as company name, source tier, source name, ATS type, and board token when available.
4.5 [x] Show `Save company` on unsaved Radar companies.
4.6 [x] Show `Saved company` when the company already exists in Companies To Watch.
4.7 [x] Do not create Applications records from Radar postings.

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
5.14 [x] If a higher-authority source later matches an existing fingerprint, update the posting's denormalized `source_tier` and primary source fields without changing `first_seen_at`.
5.15 [x] Do not model curated boards or aggregators as company-specific watchlist source rows unless a future adapter truly needs company-specific configuration.

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
7.2 [x] Score direct ATS postings highest.
7.3 [x] Score recently first-seen postings higher.
7.4 [x] Score validated-live postings higher.
7.5 [x] Penalize aggregators unless they corroborate a direct ATS posting.
7.6 [x] Penalize stale or unchecked postings.
7.7 [x] Add `source_tier` filter to `GET /api/radar/postings`.
7.8 [x] Add `validity_status` filter to `GET /api/radar/postings`.
7.9 [x] Add `sort=quality|first_seen|posted_at` to `GET /api/radar/postings`.
7.10 [x] Default to quality sort for `status=new`.
7.11 [x] Exclude `closed` and `not_found` postings from the default fresh direct matches query.
7.12 [x] Keep closed postings available through `All` and `Closed` filters.
7.13 [x] Hide closed postings from the default view when `last_validated_at` is older than about two weeks, without deleting the row.
7.14 [x] Support Radar search across posting title, company name, location, and watched-company industry.

## Step 8 — Discover and Watchlist UI

8.1 [x] Use the company-grouped Radar layout as the target Discover view.
8.2 [x] Keep source tier filters available for quick triage: `Fresh direct matches`, `Curated`, `Aggregator`, `Live only`, and `All`.
8.3 [x] Make the job title and primary posting action open the original posting URL.
8.4 [x] Show a compact source badge: `Direct ATS`, `Curated`, or `Aggregator`.
8.5 [x] Show validity state: `Live`, `Unchecked`, `Closed`, `Validation failed`, or `Stale`.
8.6 [x] Show `First seen from Greenhouse` or the relevant source name.
8.7 [x] Show `Also seen on LinkedIn` only as supporting context, not as a separate card.
8.8 [x] Replace `Add to tracker` with `Save company`.
8.9 [x] Keep closed postings visible with a closed state, but do not present them as fresh matches.
8.10 [x] Remove application-tracking actions from the Discover and Watchlist UI.
8.11 [x] Avoid bulky explanatory hero cards or tutorial panels that push job content down the page.
8.12 [x] Use the spatial three-column tier view only if curated and aggregator sources become substantial enough to compare side by side.
8.13 [x] Collapse closed postings under their company group instead of rendering them as equally prominent fresh cards.
8.14 [x] Do not add a general manual validity toggle to Radar cards in this pass.
8.15 [x] Label Radar search so it is clear that title, company, and industry terms are searchable.

## Step 9 — Trusted Discovery Criteria

9.1 [ ] Add editable Radar search criteria for target titles, fields or industries, locations, and exclusion terms.
9.2 [ ] Seed sensible default title terms such as `software engineer`, `backend engineer`, and `full-stack engineer`.
9.3 [ ] Seed field or industry terms oriented around the user's targets, such as `edtech`, `education technology`, `mission-driven`, `civic tech`, and `nonprofit tech`.
9.4 [ ] Keep criteria user-editable and persist them in `radar_criteria` or a follow-on criteria table.
9.5 [ ] Add a manual `Search trusted sources` action.
9.6 [ ] Do not run source searches automatically or on a timer.
9.7 [ ] Show why a posting matched, such as title term, field term, source, and location rule.
9.8 [ ] Keep watchlist refresh available as a secondary input, visually below trusted source search.

## Step 10 — Trusted Source Search

10.1 [ ] Define a `TrustedSourceAdapter` contract for source searches that accepts criteria and returns `NormalizedPosting[]`.
10.2 [ ] Support source-discovered postings that are not associated with a watchlist row.
10.3 [ ] Insert source-discovered postings with `radar_source_id`, `sourceName`, `sourceTier`, provenance fields, and nullable `watchlist_id`.
10.4 [ ] Reuse fingerprint dedupe so source-discovered roles merge with direct ATS or watchlist-discovered roles.
10.5 [ ] Save the discovered company to `company_watchlist` only when the user clicks `Save company`.
10.6 [ ] Build the first trusted source adapter only after evaluating whether the source meaningfully helps the user's target roles.
10.7 [ ] Prefer sources with official RSS feeds, documented APIs, or explicit export formats.
10.8 [ ] Avoid sources that require broad scraping, anti-bot bypassing, paid access, or produce mostly LinkedIn-style duplicate noise.
10.9 [ ] Treat We Work Remotely as an optional pilot candidate, not a commitment; use it only if remote-first coverage is useful enough for the user's search.
10.10 [ ] Keep Idealist as a high-value follow-up only if a safe, non-scraping integration path is chosen.

## Step 11 — Optional Metrics

11.1 [ ] Calculate lead time between first trusted-source sighting, direct ATS sighting, and later aggregator sightings.
11.2 [ ] Surface a compact metric only when it helps explain source quality, such as `Trusted sources found roles 2d before broad syndication`.
11.3 [ ] Hide metrics until there is enough data to avoid misleading averages.
11.4 [ ] Retain closed posting rows because their `source_first_seen_at` and `also_seen_on` history contributes to lead-time metrics.

## Step 12 — Tests

12.1 [ ] Add `fingerprint.test.ts` coverage proving the same role from ATS and aggregator URLs produces the same canonical fingerprint.
12.2 [ ] Add `refreshRadarSource.test.ts` coverage proving an existing posting appends `also_seen_on` instead of inserting a duplicate.
12.3 [ ] Add `refreshRadarSource.test.ts` coverage proving the highest-authority source tier remains canonical after an aggregator sighting.
12.4 [ ] Add `refreshRadarSource.test.ts` coverage proving a later direct ATS match can promote a curated or aggregator posting without changing `first_seen_at`.
12.5 [ ] Add adapter tests proving validation marks missing jobs as closed after a successful board response.
12.6 [ ] Add route tests proving saving a company from a posting does not create duplicate watchlist rows.
12.7 [ ] Add route tests proving quality sort returns direct live postings before aggregator unchecked postings.
12.8 [ ] Add route tests proving old closed postings are hidden from the default view but returned by `All` or `Closed` filters.
12.9 [ ] Add trusted source adapter tests with source-specific fixture data after the first source is selected.
12.10 [ ] Add route tests proving source-discovered postings can exist without a watchlist row.
12.11 [ ] Add route tests proving `Search trusted sources` stores source-discovered postings with `radar_source_id`.
12.12 [ ] Add frontend tests proving Radar cards render source tier badges and validity status.
12.13 [ ] Add frontend tests proving Radar cards open the original posting from the title or primary action.
12.14 [ ] Add frontend tests proving Radar cards save a company instead of creating an Application.
12.15 [ ] Add frontend tests proving closed postings are excluded from fresh-match presentation.
12.16 [ ] Add frontend tests proving source tier and validity filters update API params.
12.17 [ ] Add frontend tests proving `also_seen_on` displays as supporting provenance without rendering duplicate cards.
12.18 [ ] Add frontend tests proving there is no general manual validity override control.
12.19 [ ] Add frontend tests proving the watchlist workspace renders below trusted source search results.

## Step 13 — Verification

13.1 [ ] Run backend tests relevant to Radar ingestion, routes, and adapters.
13.2 [ ] Run frontend tests relevant to Discover and Watchlist.
13.3 [ ] Run shared, API, and web type checks.
13.4 [ ] Run the web build.
13.5 [ ] Run markdownlint on changed markdown files.
13.6 [ ] Manually verify the Discover route after signing in.
13.7 [ ] Manually verify the Watchlist section after signing in.

## Non-Goals For This Pass

1. [ ] Do not add cron jobs, scheduled jobs, background polling, or automatic refresh loops.
2. [ ] Do not build broad aggregator scraping first.
3. [ ] Do not try to solve every Workday tenant.
4. [ ] Do not introduce paid board integrations.
5. [ ] Do not create Applications records from Radar postings.
6. [ ] Do not create duplicate company watchlist rows from the same posting source.
7. [ ] Do not scrape Idealist or other curated boards that lack an official feed in this pass.
8. [ ] Do not add manual validity override UI until real closed-but-live false positives justify it.
9. [ ] Do not make the watchlist the primary Radar workflow.
10. [ ] Do not prioritize a job source simply because it is easy to integrate if it does not help the user's target roles.

## Resolved Decisions

1. [x] Keep `radar_sources` as the authoritative catalog for source names, tiers, adapter types, and validity-check support.
2. [x] Keep `company_watchlist.source_tier` as the default for company-specific direct ATS configuration only.
3. [x] Keep `discovered_postings.source_tier` as a denormalized query-time copy used by filters and quality sort.
4. [x] Do not add manual validity override UI in this pass.
5. [x] Keep closed discovered postings and demote or filter them at query time instead of hard-deleting them.
6. [x] Treat the company watchlist as a secondary Radar input, not the core discovery workflow.
7. [x] Treat We Work Remotely as an optional trusted-source pilot candidate, not a committed adapter.
