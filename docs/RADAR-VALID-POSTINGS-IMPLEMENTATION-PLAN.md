# Job Radar Valid Posting Implementation Plan

**Status:** Proposed
**Last updated:** June 23, 2026
**Scope:** Improve Job Radar so it surfaces fresh, direct, valid postings and suppresses syndication noise.

## Product Direction

Radar is a job discovery surface, not an application tracker. Its job is to surface credible openings, let the user click through to the original posting, and optionally save the company to the Companies To Watch list. It should not create Applications records or require the user to track a role.

Direct ATS sources should be the default source of truth. Curated boards are useful discovery channels. Broad aggregators are mostly confirmation signals and should not be allowed to clutter the workflow.

No cron jobs, scheduled jobs, auto-refresh loops, or other automated background polling should be added for this pass. Refresh and validation should happen only from explicit user actions.

## Source Tiers

| Tier | Source class | Examples | Product behavior |
| --- | --- | --- | --- |
| 1 | Direct ATS | Greenhouse, Lever, Ashby, Workday, SmartRecruiters | Rank highest, treat as freshest source |
| 2 | Curated boards | LinkedIn, We Work Remotely, Working Nomads, Remote.co, Idealist, FlexJobs | Useful as discovery or corroboration |
| 3 | Aggregators | Indeed, Talent.com, Monster, Jooble, Jora, Lensa, ZipRecruiter-style syndication | Append as `also_seen_on` instead of creating noise |

## Step 1 — Data Model

1.1 [x] Create a migration such as `migrations/radar_003_source_tiers.sql`.
1.2 [x] Add `source_tier_enum` with values `direct_ats`, `curated_board`, and `aggregator`.
1.3 [x] Add `posting_validity_status_enum` with values `unchecked`, `live`, `closed`, `not_found`, `stale`, and `error`.
1.4 [x] Add `source_tier source_tier_enum NOT NULL DEFAULT 'direct_ats'` to `company_watchlist`.
1.5 [x] Add `source_name TEXT` to `company_watchlist` for non-ATS sources such as LinkedIn or Idealist.
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

## Step 2 — Shared Schemas

2.1 [x] Add `SourceTierSchema` and `PostingValidityStatusSchema` in `shared/src/schemas.ts`.
2.2 [x] Extend `RadarSourceSchema` with `source_tier` and `source_name`.
2.3 [x] Extend `DiscoveredPostingSchema` with provenance and validity fields.
2.4 [x] Export inferred `SourceTier` and `PostingValidityStatus` types.
2.5 [x] Run shared package type checks.

## Step 3 — Source Configuration

3.1 [x] Add a source tier selector to the watchlist Radar configuration.
3.2 [x] Default existing ATS-backed watchlist rows to `direct_ats`.
3.3 [x] Keep ATS adapter fields visible only when `source_tier = direct_ats`.
3.4 [x] Add source setup copy that explains direct ATS, curated board, and aggregator behavior in operational terms.
3.5 [x] Create `radar_sources` table with a JSON-backed `api/src/radar/sources/registry.ts` fallback.
3.6 [x] Define known source metadata in database seed data: source name, tier, adapter type, and whether the source supports direct validity checks.
3.7 [x] Map current ATS adapters to `direct_ats`.
3.8 [x] Reserve curated-board entries for future adapters without wiring broad scraping into the first release.

## Step 4 — Save Company From Radar

4.1 [ ] Add or update the backend flow for saving a Radar posting company to `company_watchlist`.
4.2 [ ] Reuse the existing watchlist create/update behavior instead of creating an Application.
4.3 [ ] Prevent duplicate watchlist rows for the same user and company.
4.4 [ ] Preserve source context when useful, such as company name, source tier, source name, ATS type, and board token when available.
4.5 [ ] Show `Save company` on unsaved Radar companies.
4.6 [ ] Show `Saved company` when the company already exists in Companies To Watch.
4.7 [ ] Do not create Applications records from Radar postings.

## Step 5 — Provenance-Aware Ingestion

5.1 [ ] Extend `NormalizedPosting` in `api/src/radar/adapters/types.ts` with `sourceName`, `sourceTier`, optional `canonicalUrl`, and optional `companyDomain`.
5.2 [ ] Create `api/src/radar/fingerprint.ts`.
5.3 [ ] Normalize title by lowercasing, stripping seniority punctuation noise, and trimming whitespace.
5.4 [ ] Normalize company name and URL host.
5.5 [ ] Produce a deterministic fingerprint from company, normalized title, and canonical URL or external ID.
5.6 [ ] Keep exact `(watchlist_id, external_job_id)` dedupe in `refreshRadarSource`.
5.7 [ ] Before insert, look for an existing posting with the same canonical fingerprint for the same user and company.
5.8 [ ] If a fingerprint match exists, append the new source to `also_seen_on` instead of inserting a duplicate card.
5.9 [ ] Preserve the original `first_seen_at` and `first_seen_source`.
5.10 [ ] Add or update `source_first_seen_at[sourceName]`.
5.11 [ ] Prefer the lower source tier for ranking, so a direct ATS discovery remains canonical even if later seen on an aggregator.

## Step 6 — Validity Checks

6.1 [ ] Extend `AtsAdapter` in `api/src/radar/adapters/types.ts` with optional `validate?(posting: NormalizedPosting): Promise<PostingValidationResult>`.
6.2 [ ] Implement validation for Greenhouse, Lever, Ashby, and SmartRecruiters by checking whether the external job ID still appears in the current board response.
6.3 [ ] Treat network errors as `error`, not `closed`.
6.4 [ ] Treat missing jobs from a successful board response as `closed`.
6.5 [ ] Recheck validity only from explicit user actions, such as opening or saving a posting, when the current validity state is stale enough to be useful.
6.6 [ ] If validation returns `closed` or `not_found`, update the posting row and show the closed state on the card.
6.7 [ ] If validation errors, keep the posting visible and allow the user to open the source posting.
6.8 [ ] Store `last_validated_at`, `validity_status`, and `validation_error`.

## Step 7 — Ranking and API Filters

7.1 [ ] Create `api/src/radar/qualityScore.ts`.
7.2 [ ] Score direct ATS postings highest.
7.3 [ ] Score recently first-seen postings higher.
7.4 [ ] Score validated-live postings higher.
7.5 [ ] Penalize aggregators unless they corroborate a direct ATS posting.
7.6 [ ] Penalize stale or unchecked postings.
7.7 [ ] Add `source_tier` filter to `GET /api/radar/postings`.
7.8 [ ] Add `validity_status` filter to `GET /api/radar/postings`.
7.9 [ ] Add `sort=quality|first_seen|posted_at` to `GET /api/radar/postings`.
7.10 [ ] Default to quality sort for `status=new`.

## Step 8 — Discover and Watchlist UI

8.1 [ ] Use the company-grouped Radar layout as the target Discover view.
8.2 [ ] Keep source tier filters available for quick triage: `Fresh direct matches`, `Curated`, `Aggregator`, `Live only`, and `All`.
8.3 [ ] Make the job title and primary posting action open the original posting URL.
8.4 [ ] Show a compact source badge: `Direct ATS`, `Curated`, or `Aggregator`.
8.5 [ ] Show validity state: `Live`, `Unchecked`, `Closed`, `Validation failed`, or `Stale`.
8.6 [ ] Show `First seen from Greenhouse` or the relevant source name.
8.7 [ ] Show `Also seen on LinkedIn` only as supporting context, not as a separate card.
8.8 [ ] Replace `Add to tracker` with `Save company`.
8.9 [ ] Keep closed postings visible with a closed state, but do not present them as fresh matches.
8.10 [ ] Remove application-tracking actions from the Discover and Watchlist UI.
8.11 [ ] Avoid bulky explanatory hero cards or tutorial panels that push job content down the page.
8.12 [ ] Use the spatial three-column tier view only if curated and aggregator sources become substantial enough to compare side by side.

## Step 9 — Optional Metrics

9.1 [ ] Calculate lead time between first direct ATS sighting and later curated or aggregator sightings.
9.2 [ ] Surface a compact metric such as `Direct ATS found roles 51h before syndication this month`.
9.3 [ ] Hide the metric until there is enough data to avoid misleading averages.

## Step 10 — Tests

10.1 [ ] Add `fingerprint.test.ts` coverage proving the same role from ATS and aggregator URLs produces the same canonical fingerprint.
10.2 [ ] Add `refreshRadarSource.test.ts` coverage proving an existing posting appends `also_seen_on` instead of inserting a duplicate.
10.3 [ ] Add `refreshRadarSource.test.ts` coverage proving the lower source tier remains canonical after an aggregator sighting.
10.4 [ ] Add adapter tests proving validation marks missing jobs as closed after a successful board response.
10.5 [ ] Add route tests proving saving a company from a posting does not create duplicate watchlist rows.
10.6 [ ] Add route tests proving quality sort returns direct live postings before aggregator unchecked postings.
10.7 [ ] Add frontend tests proving Radar cards render source tier badges and validity status.
10.8 [ ] Add frontend tests proving Radar cards open the original posting from the title or primary action.
10.9 [ ] Add frontend tests proving Radar cards save a company instead of creating an Application.
10.10 [ ] Add frontend tests proving closed postings are excluded from fresh-match presentation.
10.11 [ ] Add frontend tests proving source tier and validity filters update API params.
10.12 [ ] Add frontend tests proving `also_seen_on` displays as supporting provenance without rendering duplicate cards.

## Step 11 — Verification

11.1 [ ] Run backend tests relevant to Radar ingestion, routes, and adapters.
11.2 [ ] Run frontend tests relevant to Discover and Watchlist.
11.3 [ ] Run shared, API, and web type checks.
11.4 [ ] Run the web build.
11.5 [ ] Run markdownlint on changed markdown files.
11.6 [ ] Manually verify the Discover route after signing in.
11.7 [ ] Manually verify the Watchlist section after signing in.

## Non-Goals For This Pass

1. [ ] Do not add cron jobs, scheduled jobs, background polling, or automatic refresh loops.
2. [ ] Do not build broad aggregator scraping first.
3. [ ] Do not try to solve every Workday tenant.
4. [ ] Do not introduce paid board integrations.
5. [ ] Do not create Applications records from Radar postings.
6. [ ] Do not create duplicate company watchlist rows from the same posting source.

## Open Questions

1. [ ] Should `source_tier` live only on watchlist sources, or should there be a dedicated `radar_sources` table for boards that are not company-specific?
2. [ ] Should users be allowed to manually override validity when they know a posting is still live?
3. [ ] Should closed discovered postings auto-dismiss, or remain visible with a closed badge for auditability?
4. [ ] Which curated board should be the first Tier 2 adapter after direct ATS reliability is done?
