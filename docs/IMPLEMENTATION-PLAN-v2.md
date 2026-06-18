# Track My Application v2.0 — Implementation Plan

**Last updated:** June 18, 2026
**Branch strategy:** Feature branches off `dev`, merged to `dev`, promoted to `main` per phase.
**Migration strategy:** Numbered versioned SQL files in `migrations/`. Each file has an `-- UP` block and a `-- DOWN` block. Run UP sequentially; run DOWN in reverse to rollback.

> **Checkbox legend**
>
> - `[ ]` not started
> - `[x]` complete

**Scope (June 2026).** Interview Tracker, In-App Notifications, Playbook, email delivery, scheduled background jobs, overdue escalation, and scheduled Radar polling moved to `IMPLEMENTATION-PLAN-v3.md`. Discover is the fourth V2 primary tab, powered by a manual Job Radar refresh flow. The Job Radar is folded in here as Phases 6 through 12, directly after Companies To Watch (Phase 5), since it builds on the watchlist and the promote-to-application flow. Radar notification alerts and automated polling are specified in `IMPLEMENTATION-PLAN-v3.md` since they require V3 notification/background-job infrastructure.

**UX correction (June 18, 2026).** The initial V2 split between a hidden Companies To Watch page and a separate Discover page is confusing. Phase 16 supersedes that layout by combining watchlist setup and discovered postings into one primary workflow. The implementation should treat source setup, refresh status, and discovered jobs as one page.

---

## [x] Phase DR — Design System & Visual Refresh

*Targets the current v1 codebase. No schema, API, or data model changes. Ship as a standalone PR before starting any v2 feature phases. Reference: [application-tracker-sdd.md](application-tracker-sdd.md) §4 — Terracotta Daylight direction.*

### DR.1 Font setup

- [x] DR.1.1 Add to `web/index.html`: Google Fonts preconnect + Mona Sans (wght 400–800) + JetBrains Mono (wght 400–600)
- [x] DR.1.2 Update `--font-family-sans` in `web/src/index.css` to `"Mona Sans", "Inter", -apple-system, sans-serif`
- [x] DR.1.3 Update `--font-family-mono` to `"JetBrains Mono", ui-monospace, monospace`

### DR.2 CSS design tokens

- [x] DR.2.1 Replace the `@theme` block in `web/src/index.css` with the full token set from [application-tracker-sdd.md](application-tracker-sdd.md) §4: surface tokens (`--bg`, `--card`, `--soft`, `--line`, etc.), ink scale (`--ink` through `--ink-4`), terracotta scale (`--accent`, `--accent-dark`, `--accent-soft`, `--accent-tint`), sage, sun, violet, rose
- [x] DR.2.2 Remove the old green `brand-*` palette and blue `accent-*` palette from `@theme`
- [x] DR.2.3 Add shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg` per [application-tracker-sdd.md](application-tracker-sdd.md) §4

### DR.3 Global base styles

- [x] DR.3.1 Update `body` base style: `background: var(--bg)` (`#FBF5EC`), `color: var(--ink)` (`#1B2540`)
- [x] DR.3.2 Add type scale utility classes per [application-tracker-sdd.md](application-tracker-sdd.md) §4: `.text-kicker` (10px / 600 / mono / 0.14em UPPER), `.text-hero`, `.text-section`, `.text-drawer`

### DR.4 Component class updates (`index.css`)

- [x] DR.4.1 `.btn-primary` — terracotta bg (`--accent`), white text, radius 8, inner box-shadow per DS §5
- [x] DR.4.2 `.btn-outline` — white bg, 1px `--line` border, `--ink` text, radius 8
- [x] DR.4.3 `.btn-ghost` — transparent, `--ink-2` text, hover `--softer` bg
- [x] DR.4.4 `.field-input`, `.field-select`, `.field-textarea` — update focus ring and border to `--line` / `--accent`
- [x] DR.4.5 Add `.pill` utility: `padding: 4px 10px; border-radius: 999px; font-weight: 600; font-size: 11px`
- [x] DR.4.6 Add `.card` utility: white bg, 1px `--line` border, radius 16, `--shadow-sm`; hover lifts `translateY(-2px)` + `--shadow-md`

### DR.5 Status and priority color mapping

- [x] DR.5.1 Update `web/src/theme/index.ts` `STATUS_COLORS` to match [application-tracker-sdd.md](application-tracker-sdd.md) §4:
  - `applied` → ink-2 / soft
  - `phone_screen` → accent-dark / accent-soft
  - `technical` → violet / violet-soft
  - `final_round` / `offered` → sage / sage-soft
  - `rejected` → rose / rose-soft
- [x] DR.5.2 Add priority color map (export from `theme/index.ts`): HIGH → `--accent` / `--accent-soft`; MED → `#A36410` / `--sun-soft`; LOW → `--ink-3` / `--soft`

### DR.6 AppHeader visual update

- [x] DR.6.1 Change header background from `bg-brand-800` to white (`--card`) with bottom border `1px solid var(--line)`
- [x] DR.6.2 Active `NavLink`: 2px terracotta bottom border (`--accent`), `--ink` text — remove `bg-white/20` style
- [x] DR.6.3 Inactive `NavLink`: `--ink-2` text, no background
- [x] DR.6.4 Version badge: `--soft` bg, `--ink-2` text (replace white-on-dark)
- [x] DR.6.5 Update brand mark to 40×40 rounded-square (radius 11), `--accent` bg, cream "A" — per DS §5 brand mark spec

### DR.7 Avatar component

- [x] DR.7.1 Create `web/src/components/Avatar.tsx` — displays 2-letter initials, radius 12, fixed sun-soft bg (`#F5E6C4`) / amber fg (`#A36410`) for all users

### DR.8 Kicker section labels

- ~~DR.8.1~~ Removed — numbered kicker labels (`01 / PIPELINE`, etc.) were dropped; the `.text-kicker` CSS class remains available for other uses

### DR.9 Unit tests

- [x] DR.9.1 Add `vitest` to `api/package.json` and `web/package.json`; create `vitest.config.ts` in each workspace
- [x] DR.9.2 Unit test: `Avatar` initials — two-word name, single name, three-word name

### DR.10 QA

- [x] DR.10.1 Smoke-test Dashboard, Login, Profile pages in Chrome and Safari
- [x] DR.10.2 Confirm no green `brand-*` color remains in any rendered UI
- [x] DR.10.3 Verify no horizontal overflow at 320px viewport

---

## [x] Phase 0 — Schema & Infrastructure

*All schema work must complete before any feature code is written. The existing `jobs` and `job_boards` tables are never modified. New feature code targets the new `applications` table exclusively. A one-time data import from `jobs` → `applications` runs after all features are complete (see Phase 15). Each migration is a standalone file that can be applied or rolled back independently.*

### 0.1 Migration files setup

- [x] 0.1.1 Create `migrations/` directory at project root
- [x] 0.1.2 Create `migrations/README.md` documenting UP/DOWN convention and how to run migrations via Supabase SQL Editor
- [x] 0.1.3 Add `migrations/v2_000_verify_baseline.sql` to confirm `jobs` and `job_boards` tables exist before running v2 migrations

### 0.2 Migration v2_001 — Enums

File: `migrations/v2_001_enums.sql`

- [x] 0.2.1 Create `application_status_enum` (new enum; does not modify existing `job_status_enum`)
- [x] 0.2.2 Create `application_type_enum` (`cold_strategic`, `recruiter_assisted`, `referral`, `other`)
- [x] 0.2.3 Create `contact_type_enum` (`company_contact`, `recruiter`, `other`)
- [x] 0.2.4 Create `outreach_status_enum`
- [x] 0.2.5 Create `recruiter_status_enum`
- [x] 0.2.6 Create `interview_type_enum`, `interview_status_enum`, `interview_outcome_enum`
- [x] 0.2.7 Create `task_category_enum`, `task_priority_enum`, `task_status_enum`
- [x] 0.2.8 Create `contact_interaction_type_enum`
- [x] 0.2.9 Create `contact_template_type_enum`
- [x] 0.2.10 Create `preferred_contact_method_enum`, `how_found_enum`
- [x] 0.2.11 Write DOWN block: `DROP TYPE IF EXISTS` for each enum in reverse order

### 0.3 Migration v2_002 — `applications` table

File: `migrations/v2_002_applications.sql`

- [x] 0.3.1 Create `applications` table with all columns from [application-tracker-sdd.md](application-tracker-sdd.md) §5.2
- [x] 0.3.2 Add `updated_at` trigger (reuse `update_updated_at()` function)
- [x] 0.3.3 Add `auto_applied_date` trigger (same logic as on `jobs`)
- [x] 0.3.4 Create all indexes for `applications` (see PRD §6.2)
- [x] 0.3.5 Write DOWN block: `DROP TABLE IF EXISTS applications CASCADE`

### 0.4 Migration v2_003 — `contacts` table

File: `migrations/v2_003_contacts.sql`

- [x] 0.4.1 Create `contacts` table with all columns from [application-tracker-sdd.md](application-tracker-sdd.md) §5.3 — use `first_name` and `last_name` (separate columns, both NOT NULL max 100) instead of a single `full_name` column
- [x] 0.4.2 Add `updated_at` trigger
- [x] 0.4.3 Create all indexes for `contacts`
- [x] 0.4.4 Write DOWN block

### 0.5 Migration v2_004 — `contact_interactions` table

File: `migrations/v2_004_contact_interactions.sql`

- [x] 0.5.1 Create `contact_interactions` table
- [x] 0.5.2 Create indexes
- [x] 0.5.3 Write DOWN block

### 0.6 Migration v2_005 — `contact_templates` table

File: `migrations/v2_005_contact_templates.sql`

- [x] 0.6.1 Create `contact_templates` table
- [x] 0.6.2 Add `updated_at` trigger
- [x] 0.6.3 Create indexes
- [x] 0.6.4 Write DOWN block

### 0.7 Migration v2_006 — `application_contacts` join table

File: `migrations/v2_006_application_contacts.sql`

- [x] 0.7.1 Create `application_contacts` table with UNIQUE constraint on `(application_id, contact_id)`
- [x] 0.7.2 Create indexes
- [x] 0.7.3 Write DOWN block

### 0.8 Migration v2_007 — `tasks` table

File: `migrations/v2_007_tasks.sql`

- [x] 0.8.1 Create `tasks` table
- [x] 0.8.2 Add `updated_at` trigger
- [x] 0.8.3 Create indexes
- [x] 0.8.4 Write DOWN block

### 0.9 Migration v2_008 — `interviews` table

File: `migrations/v2_008_interviews.sql`

- [x] 0.9.1 Create `interviews` table
- [x] 0.9.2 Add `updated_at` trigger
- [x] 0.9.3 Create indexes
- [x] 0.9.4 Write DOWN block

> **Dormant V3 schema note:** `interviews` is intentionally created in V2 as forward-compatible schema because the migration already exists. No V2 route or UI should expose Interview Tracker behavior. V3 owns the active interview API and UI work.

### 0.10 Migration v2_010 — `company_watchlist` table

File: `migrations/v2_010_company_watchlist.sql`

- [x] 0.10.1 Create `company_watchlist` table with all columns from [application-tracker-sdd.md](application-tracker-sdd.md) §5.5
- [x] 0.10.2 Add `updated_at` trigger
- [x] 0.10.3 Create all indexes for `company_watchlist`
- [x] 0.10.4 Write DOWN block: `DROP TABLE IF EXISTS company_watchlist CASCADE`

### 0.11 Shared types

- [x] 0.11.1 Update `shared/src/constants.ts` with new field length limits
- [x] 0.11.2 Create Zod schemas in `shared/src/schemas/` for: `Application`, `Contact`, `ContactInteraction`, `ContactTemplate`, `ApplicationContact`, `Task`, `Interview`, `CompanyWatchlistEntry`
- [x] 0.11.3 Export all schemas from `shared/src/index.ts`

### 0.13 Migration v2_012 — `application_events` table

File: `migrations/v2_012_application_events.sql`

- [x] 0.13.1 Create `application_event_type_enum` (`status_change`, `company_reached_out`, `info_requested`, `document_submitted`, `offer_received`, `interview_scheduled`, `rejection`, `note`)
- [x] 0.13.2 Create `application_events` table with all columns from PRD §9.2
- [x] 0.13.3 Create indexes: `idx_application_events_application_id`, `idx_application_events_occurred_at`
- [x] 0.13.4 Add `CreateApplicationEventSchema` to `shared/src/schemas.ts`; exported via `shared/src/index.ts`
- [x] 0.13.5 Write DOWN block: `DROP TABLE IF EXISTS application_events CASCADE; DROP TYPE IF EXISTS application_event_type_enum;`

### 0.14 Migration v2_014 — default application type

File: `migrations/v2_014_default_application_type.sql`

- [x] 0.14.1 Backfill existing `applications.application_type IS NULL` rows to `cold_strategic`
- [x] 0.14.2 Set `applications.application_type` default to `cold_strategic`
- [x] 0.14.3 Set `applications.application_type` to `NOT NULL`
- [x] 0.14.4 Write DOWN block: drop `NOT NULL` and default from `application_type`

### 0.15 Migration v2_015 — application source field

File: `migrations/v2_015_application_source.sql`

- [x] 0.15.1 Create `application_source_enum` (`manual`, `imported`, `watchlist`, `radar`)
- [x] 0.15.2 `ALTER TABLE applications` add `source application_source_enum NOT NULL DEFAULT 'manual'`
- [x] 0.15.3 `ALTER TABLE applications` add `source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- [x] 0.15.4 Backfill rows imported from `jobs` to `source = 'imported'`
- [x] 0.15.5 Create index `idx_applications_source`
- [x] 0.15.6 Write DOWN block: drop `source_metadata`, `source`, and `application_source_enum`

### 0.16 Migration v2_016 — watchlist target apply date

File: `migrations/v2_016_company_watchlist_target_apply_date.sql`

- [x] 0.16.1 Add `company_watchlist.target_apply_date DATE`
- [x] 0.16.2 Backfill existing `target_apply_year` values to January 1 of that year
- [x] 0.16.3 Drop legacy `target_apply_year`
- [x] 0.16.4 Write DOWN block: restore `target_apply_year` from `target_apply_date` year and drop `target_apply_date`

---

## [x] Phase 1 — Navigation & Layout Restructure

*Restructure the shell before adding feature content. This phase is purely frontend.*

### 1.1 Tab bar component

- [x] 1.1.1 Update `web/src/components/NavBar.tsx` — four primary tabs: Applications (Apps on mobile), Contacts, Discover, Action Items
- [x] 1.1.2 On desktop (≥768px): horizontal tab bar at the top below the header
- [x] 1.1.3 On mobile (<768px): fixed bottom navigation bar with icon + label per tab
- [x] 1.1.4 Active tab state: underline on desktop, filled icon on mobile
- [x] 1.1.5 Tab bar scrolls horizontally (not wrapping) if viewport is too narrow
- [x] 1.1.6 Remove Interviews from V2 primary navigation; V3 owns Interview Tracker navigation

### 1.2 Hamburger menu

- [x] 1.2.1 Create `web/src/components/HamburgerMenu.tsx` — slide-in drawer or dropdown
- [x] 1.2.2 Menu items: Companies To Watch, Profile, Sign out
- [x] 1.2.3 Hamburger icon in the header top-right; accessible keyboard nav
- [x] 1.2.4 On mobile: drawer slides in from the right
- [x] 1.2.5 Remove Playbook and Notifications from V2 hamburger menu; V3 owns those routes
- [x] 1.2.6 Remove Job Boards from V2 hamburger menu once Companies To Watch is available

### 1.3 App header

- [x] 1.3.1 Update `web/src/components/AppHeader.tsx` to remove Dashboard/Job Boards pills
- [x] 1.3.2 Show app name, version badge, and user avatar only
- [x] 1.3.3 Remove all references to the word "Dashboard" from user-facing UI

### 1.4 Routing

- [x] 1.4.1 Update `web/src/App.tsx` routes: `/applications`, `/contacts`, `/radar`, `/action-items`, `/watchlist`, `/profile`
- [x] 1.4.2 Default route redirects to `/applications`
- [x] 1.4.3 Redirect old `/dashboard`, `/interviews`, `/playbook`, and `/notifications` routes to `/applications` until V3 restores the deferred pages
- [x] 1.4.4 Remove `/job-boards` from V2 navigation; keep route only if needed for backwards-compatible redirect

### 1.5 Page scaffolding

- [x] 1.5.1 Create empty page components needed for V2: `ContactsPage.tsx`, `ActionItemsPage.tsx`, `WatchlistPage.tsx`, `RadarPage.tsx`
- [x] 1.5.2 Each page shows a placeholder empty state with a descriptive heading
- [x] 1.5.3 Verify tab bar active state updates on navigation

---

## [x] Phase 2 — Applications Tab & Application Type

### 2.1 API — applications route

- [x] 2.1.1 Create `api/src/routes/applications.ts` mirroring `jobs.ts` but querying the `applications` table
- [x] 2.1.2 `GET /api/applications` — list with optional `?status`, `?application_type`, `?search`, `?date_from` (ISO date), `?date_to` (ISO date), `?page` (default 1), `?limit` (default 25, max 100) query params; no year constraint; returns `{ data: Application[], total: number, page: number, totalPages: number }`
- [x] 2.1.3 `POST /api/applications` — create; validate with `CreateApplicationSchema`
- [x] 2.1.4 `GET /api/applications/:id` — single record with ownership check
- [x] 2.1.5 `PATCH /api/applications/:id` — partial update; support `application_type` and `checklist_state`
- [x] 2.1.6 `DELETE /api/applications/:id` — delete with cascade prompt flag in response
- [x] 2.1.7 Register routes in `api/src/app.ts`: `app.use('/api/applications', applicationsRouter)`

### 2.2 Applications tab UI

- [x] 2.2.1 Update `web/src/pages/DashboardPage.tsx` → rename to `ApplicationsPage.tsx`; update all imports
- [x] 2.2.2 Add date range filter to the search/filter bar: `date_from` and `date_to` date pickers (both optional); filter applies to `applied_date`; no year constraint enforced anywhere
- [x] 2.2.3 Pipeline conversion bar component showing counts per status stage
- [x] 2.2.4 Application list: add Application Type tag column and Checklist progress fraction column
- [x] 2.2.5 Application Type tag: color-coded badge per type (blue/purple/green/gray dashed)
- [x] 2.2.6 Checklist progress fraction: color-coded (green/amber/red/dash); clickable → navigates to Contacts tab for that application
- [x] 2.2.7 Urgent tasks widget (top 3 high-priority open tasks) below application list
- [x] 2.2.8 Create `web/src/components/Pagination.tsx` — previous/next buttons, current page indicator, total pages; props: `page`, `totalPages`, `onPageChange`
- [x] 2.2.9 Render `<Pagination>` below the application list; reflect `?page=N` in the URL query string for browser back/forward support

### 2.3 Application Type field

- [x] 2.3.1 Add Application Type dropdown to the Add/Edit application modal
- [x] 2.3.2 "Not set" shows as gray dashed tag; prompt appears in Applications tab when any application has `application_type = null`
- [x] 2.3.3 Changing Application Type triggers checklist recalculation and task cancellation logic (API side)

### 2.4 Checklist

- [x] 2.4.1 Create `web/src/components/Checklist.tsx` — 18-step checklist with grouped phases: Before you apply, Day 0, Day 4–5 follow-up, After a phone screen
- [x] 2.4.2 Progress bar + summary label (e.g. "8 of 18 complete")
- [x] 2.4.3 Steps 6–12 rendered as N/A (muted) when `application_type = recruiter_assisted`
- [x] 2.4.4 Steps 9–12 rendered as N/A when `application_type = referral`
- [x] 2.4.5 Each checkbox change PATCHes `checklist_state` on the application record

> **Follow-up:** Render `Checklist` in the application-facing detail/panel once that surface exists, then verify checkbox changes PATCH `checklist_state`.

### 2.5 Unit tests

- [x] 2.5.1 Unit test: pagination — 26 records with `limit=25` returns `page=1` with 25 items and `totalPages=2`
- [x] 2.5.2 Unit test: date range filter — records outside `date_from`/`date_to` are excluded; both bounds are inclusive
- [x] 2.5.3 Unit test: no year constraint — records from multiple calendar years are all returned when no date filter is applied

### 2.6 API — application events routes

- [x] 2.6.1 Add `GET /api/applications/:id/events` to `api/src/routes/applications.ts` — list event log entries ordered by `occurred_at DESC`; ownership check on the parent application
- [x] 2.6.2 Add `POST /api/applications/:id/events` — append an event log entry; validate with `CreateApplicationEventSchema`; `occurred_at` defaults to now if not provided; `contact_id` must belong to `req.user.id` if provided
- [x] 2.6.3 Unit test: POST returns 403 when the parent application belongs to another user
- [x] 2.6.4 Unit test: POST with a `contact_id` owned by a different user returns 400

### 2.7 Application event log UI

- [x] 2.7.1 Create `web/src/components/ApplicationEventLog.tsx` — vertical timeline ordered by `occurred_at` DESC
- [x] 2.7.2 Each entry: event type label, elapsed time (e.g. "2 days ago"), body text if present, contact name if linked
- [x] 2.7.3 Inline Add Event form below the timeline: `event_type` dropdown, `body` textarea (optional), `occurred_at` field (defaults to now)
- [x] 2.7.4 On submit: POST to `/api/applications/:id/events`; prepend the new entry to the timeline
- [x] 2.7.5 Surface `ApplicationEventLog` in the application detail panel (within the Contacts tab per-application view — see Phase 3.5)

---

## [x] Phase 3 — Unified Contacts System

### 3.1 API — contacts routes

- [x] 3.1.1 Create `api/src/routes/contacts.ts`
- [x] 3.1.2 `GET /api/contacts` — list with `?contact_type`, `?application_id`, `?outreach_status`, `?recruiter_status` filters
- [x] 3.1.3 `POST /api/contacts` — create; verify `application_id` ownership if provided
- [x] 3.1.4 `GET /api/contacts/:id` — ownership check
- [x] 3.1.5 `PATCH /api/contacts/:id` — update; on `outreach_status → double_down_sent`, auto-create follow-up task
- [x] 3.1.6 `DELETE /api/contacts/:id` — cascade delete interactions and templates
- [x] 3.1.7 `POST /api/contacts/:id/interactions` — append interaction log entry
- [x] 3.1.8 `GET /api/contacts/:id/interactions` — list entries, ordered by `occurred_at DESC`
- [x] 3.1.9 `POST /api/contacts/:id/templates` — attach template
- [x] 3.1.10 `PATCH /api/contacts/:id/templates/:tid` — update template
- [x] 3.1.11 `DELETE /api/contacts/:id/templates/:tid` — delete template
- [x] 3.1.12 `POST /api/applications/:id/contacts` — link recruiter contact to application
- [x] 3.1.13 `DELETE /api/applications/:id/contacts/:cid` — unlink recruiter from application
- [x] 3.1.14 Register in `app.ts`

### 3.2 Business logic — auto task creation

- [x] 3.2.1 Create `api/src/services/taskAutoGeneration.ts`
- [x] 3.2.2 `createDoubleDownFollowUpTask(contactId, userId, applicationId)` — creates follow-up task with `due_date = today + 4 business days`
- [x] 3.2.3 `createApplicationDoubleDownTask(applicationId, userId)` — task for cold_strategic on applied status
- [x] 3.2.4 Helper: `addBusinessDays(date, days)` — skips Sat/Sun
- [x] 3.2.5 Unit tests for `addBusinessDays` — weekends skipped, multi-week spans, spans that start on a Friday
- [x] 3.2.6 Unit test: `createDoubleDownFollowUpTask` sets `due_date` to exactly today + 4 business days
- [x] 3.2.7 Unit test: `createApplicationDoubleDownTask` does not fire when `application_type` is not `cold_strategic`

### 3.3 Contacts tab UI

- [x] 3.3.1 Create `web/src/pages/ContactsPage.tsx`
- [x] 3.3.2 Contact list view: rows show contact_type badge, name, title/agency, linked company, outreach/recruiter status, date of last outreach
- [x] 3.3.3 Filter bar: contact_type toggle (All / Company / Recruiter), outreach_status filter, recruiter_status filter
- [x] 3.3.4 Search by contact name or company
- [x] 3.3.5 Sort controls: status, company, date added, date of last outreach
- [x] 3.3.6 Color-coded outreach status tags per PRD §2.8
- [x] 3.3.7 Add Contact button — opens modal with contact_type selector; form fields change based on type
- [x] 3.3.8 Company contact form fields: application selector, outreach_status, how_found
- [x] 3.3.9 Recruiter form fields: agency, preferred_contact_method, recruiter_status

### 3.4 Contact detail panel

- [x] 3.4.1 Clicking a contact row expands an inline detail panel (or modal on mobile)
- [x] 3.4.2 Panel shows all fields, interaction log (reverse chronological), templates list
- [x] 3.4.3 Quick-action: update outreach status from the panel
- [x] 3.4.4 Interaction log entry form: purpose dropdown + body text field + occurred_at (defaults to now)
- [x] 3.4.5 Templates section: list existing templates; Add Template button opens inline form
- [x] 3.4.6 Template form: name, template_type dropdown, body rich text

### 3.5 Per-application contacts panel (within Contacts tab)

- [x] 3.5.1 When navigating to Contacts tab from an Applications tab row, the Contacts tab pre-filters to that application
- [x] 3.5.2 Application header card: shows company, role, Application Type tag, checklist progress
- [x] 3.5.3 Go back and finish step 2.4.5
- [x] 3.5.4 Contacts sub-panel: list of contacts linked to that application with name, role, outreach status, quick-action button
- [x] 3.5.5 + Add Contact button scoped to that application
- [x] 3.5.6 Linked recruiters section: list of recruiter contacts linked via `application_contacts`

### 3.6 Edit and delete contacts

- [x] 3.6.1 Add `deleteContact` to `web/src/api/contacts.api.ts`
- [x] 3.6.2 Add `useDeleteContact` hook to `web/src/hooks/useContacts.ts`
- [x] 3.6.3 Extend `ContactModal` with `initialContact` prop — pre-populates all fields; title becomes "Edit Contact"
- [x] 3.6.4 Add `onEdit`, `onDelete`, and `deletingContactId` props to `ContactsList`; render Edit button and trash icon with AlertDialog confirm in each row
- [x] 3.6.5 Wire up edit/delete handlers in `ContactsPage` — both the global list and the per-application scoped list

---

## [x] Phase 4 — Action Items & Task Queue

### [x] 4.1 API — tasks routes

- [x] 4.1.1 Create `api/src/routes/tasks.ts`
- [x] 4.1.2 `GET /api/tasks` — list with `?category`, `?priority`, `?status`, `?application_id`, `?date_from`, and `?date_to` filters; default sort: priority high→low, due_date asc
- [x] 4.1.3 `POST /api/tasks` — manual creation; verify linked application/contact ownership
- [x] 4.1.4 `GET /api/tasks/:id` — ownership check
- [x] 4.1.5 `PATCH /api/tasks/:id` — update status, priority, due_date, notes
- [x] 4.1.6 `DELETE /api/tasks/:id` — ownership check
- [x] 4.1.7 Register in `app.ts`

### [x] 4.2 Auto-task triggers

- [x] 4.2.1 Application added or changed to `cold_strategic` with no linked contact creates "Find engineering lead at [company] for double-down" due next day
- [x] 4.2.2 Application changed to `recruiter_assisted` suppresses cold-outreach auto-tasks; recruiter follow-up remains a manual task in V2
- [x] 4.2.3 Application changed to `referral` creates a referral thank-you task due same day when a referral contact is linked
- [x] 4.2.4 Changing application type cancels or skips pending auto-generated tasks that no longer apply
- [x] 4.2.5 Unit test: no-contact cold strategic task is created once and not duplicated
- [x] 4.2.6 Unit test: recruiter-assisted applications do not create time-based follow-up tasks in V2
- [x] 4.2.7 Unit test: referral thank-you task is created only for referral applications

### [x] 4.3 Action Items tab UI

- [x] 4.3.1 Create `web/src/pages/ActionItemsPage.tsx`
- [x] 4.3.2 Task list: grouped sections Open and Done
- [x] 4.3.3 Each row: priority indicator dot, title, category badge, linked company name, due date, countdown, application_type secondary label
- [x] 4.3.4 Quick-complete checkbox — single click marks `status = complete`, moves to Done section
- [x] 4.3.5 Filter bar: category, priority, status (open/done/skipped), due date range
- [x] 4.3.6 Group by toggle: company, category, due date
- [x] 4.3.7 Add Task button — opens modal with all task fields; application and contact selectors
- [x] 4.3.8 Past-due tasks: highlighted row with red "Missed" label; no automatic priority escalation

### [x] 4.4 Applications tab widget

- [x] 4.4.1 Create `web/src/components/UrgentTasksWidget.tsx`
- [x] 4.4.2 Shows top 3 open high-priority tasks with title, company, due date
- [x] 4.4.3 "View all" link → navigates to Action Items tab
- [x] 4.4.4 Updates in real time on task status change (re-fetch on focus or after mutation)

---

## [ ] Phase 5 — Companies To Watch

### [x] 5.1 API — watchlist routes

- [x] 5.1.1 Create `api/src/routes/watchlist.ts`
- [x] 5.1.2 `GET /api/watchlist` — list with `?search`, `?priority`, `?target_apply_date_from`, and `?target_apply_date_to` filters; ordered by `added DESC`
- [x] 5.1.3 `POST /api/watchlist` — create entry; validate with `CreateWatchlistEntrySchema`
- [x] 5.1.4 `GET /api/watchlist/:id` — ownership check
- [x] 5.1.5 `PATCH /api/watchlist/:id` — update fields
- [x] 5.1.6 `DELETE /api/watchlist/:id` — ownership check
- [x] 5.1.7 `POST /api/watchlist/:id/promote` — create an `applications` record from `company_name` and `industry` with `source = 'watchlist'`; delete the watchlist entry; return the new application ID
- [x] 5.1.8 Register in `app.ts`
- [x] 5.1.9 Unit test: `promote` returns the new application ID and the watchlist entry no longer exists after the call
- [x] 5.1.10 Unit test: `promote` on a non-existent entry returns 404; on another user's entry returns 403

### [x] 5.2 Companies To Watch UI

- [x] 5.2.1 Create `web/src/pages/WatchlistPage.tsx`
- [x] 5.2.2 List view: rows show company name, industry badge, priority dot, target apply date, one-line notes preview
- [x] 5.2.3 Search bar: filter by company name as user types
- [x] 5.2.4 Filter controls: priority dropdown, target apply date range inputs
- [x] 5.2.5 Sort controls: date added, company name, priority, target apply date
- [x] 5.2.6 Add Company button — opens modal with all watchlist entry fields
- [x] 5.2.7 Edit action on each row — opens prefilled modal
- [x] 5.2.8 Delete action — single confirmation prompt before removal
- [x] 5.2.9 "Start Application" button on each row — calls `POST /api/watchlist/:id/promote`; on success, navigate to the new application in the Applications tab
- [x] 5.2.10 Empty state: instructional text explaining the purpose of the list with a primary "Add a Company" CTA
- [x] 5.2.11 Add `/watchlist` route to `web/src/App.tsx`
- [x] 5.2.12 Add "Companies To Watch" item to `HamburgerMenu.tsx` linking to `/watchlist`

---

> **What this is.** The job radar supports Companies To Watch without adding a V2 background scheduler. Instead of adding a company and checking its careers page by hand, the user can manually refresh each enabled company's public ATS feed. The app normalizes the postings, filters them to your criteria (senior and remote or LA), and surfaces fresh matches you promote into an application with the promote flow that already exists. It reuses the `applications` table and the watchlist promote pattern. Scheduled polling and alerting are specified in `IMPLEMENTATION-PLAN-v3.md` since they depend on V3 notification/background-job infrastructure.

---

## [x] Phase 6. Schema additions

*All changes are additive. The `applications` and `company_watchlist` base tables are extended, not modified destructively. One migration file, following the existing versioned convention.*

### [x] 6.1 Migration radar_001

File: `migrations/radar_001_job_radar.sql`

- [x] 6.1.1 Create `ats_type_enum` (`greenhouse`, `lever`, `ashby`, `smartrecruiters`, `pinpoint`, `welcomekit`, `custom`)
- [x] 6.1.2 Create `posting_status_enum` (`new`, `seen`, `dismissed`, `promoted`)
- [x] 6.1.3 `ALTER TABLE company_watchlist` add `ats_type`, `ats_board_token`, `radar_enabled` (boolean default false), `last_refreshed_at`
- [x] 6.1.4 Create `discovered_postings` table: `id`, `user_id`, `watchlist_id` FK, `company_name`, `external_job_id`, `title`, `location`, `remote_status`, `url`, `posted_at`, `first_seen_at` default now, `status` (posting_status_enum default new), `raw_payload` jsonb
- [x] 6.1.5 Add UNIQUE constraint on `(watchlist_id, external_job_id)` to dedupe sightings
- [x] 6.1.6 Create indexes: `user_id`, `status`, `first_seen_at`, `watchlist_id`
- [x] 6.1.7 Add `updated_at` trigger
- [x] 6.1.8 Write DOWN block: drop the table, the enums, and the added watchlist columns in reverse order

### [x] 6.2 Shared types

- [x] 6.2.1 Add Zod schemas `DiscoveredPosting` and `RadarSource` in `shared/src/schemas/`
- [x] 6.2.2 Export both from `shared/src/index.ts`

---

## [x] Phase 7. ATS adapter layer

*The core abstraction. Each ATS returns a different JSON shape, so one adapter per type maps to a single normalized posting. Greenhouse first, since it covers seven of your current targets.*

### [x] 7.1 Adapter interface and normalizer

- [x] 7.1.1 Create `api/src/radar/adapters/types.ts` defining `AtsAdapter` with `fetch(boardToken): Promise<NormalizedPosting[]>`
- [x] 7.1.2 Define `NormalizedPosting`: `externalId`, `title`, `location`, `remoteStatus`, `url`, `postedAt`, `raw`
- [x] 7.1.3 Create `api/src/radar/normalize.ts` with location parsing and a remote-status detector (remote US, LA, onsite, unknown)

### [x] 7.2 Greenhouse adapter

- [x] 7.2.1 Create `greenhouse.ts`: GET `https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`, map `jobs[]` fields (`id`, `title`, `location.name`, `absolute_url`, `updated_at`)
- [x] 7.2.2 Unit test against a saved Greenhouse fixture payload (Khan, Newsela, CodePath, Outschool, Guild, Learneo, GoGuardian all use this)

### [x] 7.3 Additional adapters

- [x] 7.3.1 Lever adapter: GET `https://api.lever.co/v0/postings/{site}?mode=json` (Age of Learning)
- [x] 7.3.2 Ashby adapter: the posting-api job board endpoint (Instructure)
- [x] 7.3.3 SmartRecruiters adapter: the public postings API (Turnitin)
- [x] 7.3.4 Pinpoint and Welcome Kit adapters, or an HTML fallback if no clean JSON feed (Desmos, UPchieve)
- [x] 7.3.5 Custom-site fallback for Nerdy (`careers.varsitytutors.com`)
- [x] 7.3.6 Unit test each adapter against a saved fixture

### [x] 7.4 Adapter registry

- [x] 7.4.1 Map `ats_type` to the right adapter; throw a clear error on an unknown type

---

## [x] Phase 8. Manual ingestion

### [x] 8.1 Refresh service

- [x] 8.1.1 Create `api/src/radar/refreshRadarSource.ts`
- [x] 8.1.2 Accept a single `company_watchlist` row where `radar_enabled = true`
- [x] 8.1.3 Resolve the adapter by `ats_type`, fetch, and normalize; return a clear error for a bad board token without affecting other sources
- [x] 8.1.4 Apply the match filter (Phase 9) to each normalized posting
- [x] 8.1.5 Upsert into `discovered_postings` on `(watchlist_id, external_job_id)`; insert with status `new` on first sighting, leave existing rows untouched
- [x] 8.1.6 Update `last_refreshed_at` on the watchlist row
- [x] 8.1.7 Unit test: a new `external_job_id` inserts one row with status `new`; a repeat refresh inserts nothing
- [x] 8.1.8 Unit test: a bad source returns an error and does not insert partial data

---

## [x] Phase 9. Match filter

### [x] 9.1 Filter logic

- [x] 9.1.1 Create `api/src/radar/match.ts` with `matches(posting, criteria): boolean`
- [x] 9.1.2 MVP criteria hardcoded: title contains a seniority term (senior, staff, principal) and excludes junior or intern, AND location reads remote US or LA
- [x] 9.1.3 Unit test: senior remote passes; junior remote fails; senior onsite outside LA fails

### [x] 9.2 Configurable criteria (after MVP)

- [x] 9.2.1 Add a small `radar_criteria` table or a user profile column for include and exclude keywords, location rules, and seniority terms
- [x] 9.2.2 Read per-user criteria in the matcher; fall back to the MVP defaults when none are set

---

## [x] Phase 10. API routes

### [x] 10.1 Radar routes

- [x] 10.1.1 Create `api/src/routes/radar.ts`
- [x] 10.1.2 `GET /api/radar/postings` for `req.user.id` with `?status`, `?watchlist_id`, `?search`; sort `first_seen_at DESC`
- [x] 10.1.3 `PATCH /api/radar/postings/:id` to set status (`seen`, `dismissed`); ownership check
- [x] 10.1.4 `POST /api/radar/postings/:id/promote` creates an `applications` record from the posting (`company_name`, `title`, `job_link`, `source = 'radar'`, `source_metadata.discovered_posting_id`, `applied_date = null`), sets status `promoted`, and returns the new application id. Reuse the watchlist promote pattern from Phase 5
- [x] 10.1.5 Extend `PATCH /api/watchlist/:id` to set `ats_type`, `ats_board_token`, and `radar_enabled`
- [x] 10.1.6 Add `POST /api/radar/sources/:watchlistId/refresh` to manually refresh one enabled source and return inserted/matched counts
- [x] 10.1.7 Register in `app.ts`
- [x] 10.1.8 Unit test: promote creates an application and flips the posting to `promoted`; promote on another user's posting returns 403
- [x] 10.1.9 Unit test: manual refresh on another user's watchlist entry returns 403

---

## [x] Phase 11. Discover UI

> **Superseded layout note:** Phase 11 shipped the first split-page implementation. Phase 16 revises this into a combined Discover/Watchlist page so users can configure watched companies and review discovered jobs in one place.

### [x] 11.1 Discover page

- [x] 11.1.1 Create `web/src/pages/RadarPage.tsx`, labeled Discover in navigation
- [x] 11.1.2 List new matched postings grouped by company, newest first, each with a NEW badge, posted and first-seen dates, and a remote tag
- [x] 11.1.3 Add to tracker button on each card calls promote, then navigates to the new application
- [x] 11.1.4 Dismiss button sets status `dismissed` and removes the card
- [x] 11.1.5 Filter bar: status, company, search
- [x] 11.1.6 Empty state explaining how to enable radar on a watchlist company and use manual refresh
- [x] 11.1.7 Add the `/radar` route to `App.tsx` and a Discover entry to the primary `NavBar`

### [x] 11.2 Watchlist radar toggle

- [x] 11.2.1 Extend the Companies To Watch modal with ATS type, board token, and an Enable radar toggle
- [x] 11.2.2 Helper text on where to find the board token, pointing at the careers URL
- [x] 11.2.3 Add a Refresh radar button on enabled watchlist entries; show last refreshed timestamp and inserted/matched count after completion

---

## [x] Phase 12. QA and verification

- [x] 12.1 Run manual refresh against the seven Greenhouse boards and confirm real postings land in `discovered_postings`
- [x] 12.2 Confirm dedupe: a second manual refresh inserts no duplicate rows
- [x] 12.3 Confirm the match filter keeps only senior remote or LA roles
- [x] 12.4 Promote a discovered posting and confirm it appears in the Applications tab with `source = 'radar'`
- [x] 12.5 Confirm per-source error isolation: a deliberately bad board token does not abort the run

---

## [x] Phase 13 — Mobile Polish & Cross-Browser QA

- [x] 13.1 Verify all pages render correctly on iPhone 14 viewport (390×844)
- [x] 13.2 Verify all pages render correctly on Android mid-range viewport (360×780)
- [x] 13.3 Bottom navigation bar is fixed and does not overlap content on any mobile viewport
- [x] 13.4 Modals and drawers are full-screen on mobile
- [x] 13.5 All form inputs are at least 44px tap target height
- [x] 13.6 Touch scrolling works on all lists (application list, contact list, task list, watchlist, Discover postings)
- [x] 13.7 Filter bars scroll horizontally on mobile without wrapping
- [x] 13.8 Checklist checkboxes are tappable on mobile
- [x] 13.9 Empty states display correctly on all viewports
- [x] 13.10 Test in Chrome, Firefox, and Safari (desktop)
- [x] 13.11 Verify no horizontal overflow on any page at 320px viewport width

---

## [x] Phase 14 — Final Wiring & End-to-End Testing

- [x] 14.1 Final end-to-end test: add application → set type → add contact → update outreach status → verify task auto-created → mark task complete
- [x] 14.2 End-to-end test: add company to watchlist → promote to application → verify application appears in Applications tab and watchlist entry is removed
- [x] 14.3 Verify date range filter returns only records with applied_date within the specified range; verify empty result when no records match
- [x] 14.4 Verify pagination: 26 records return page 1 (25 records) and page 2 (1 record) with correct `totalPages`

---

## [x] Phase 15 — Data Import from `jobs` table

*Run this phase only after all features are complete and tested. The `jobs` table is read-only during this step — no records are deleted or modified.*

### [x] 15.1 Write import migration

File: `migrations/v2_011_import_jobs.sql`

- [x] 15.1.1 Write `INSERT INTO applications (...) SELECT ... FROM jobs` mapping all overlapping columns
- [x] 15.1.2 Map `job_status_enum` values to `application_status_enum` equivalents
- [x] 15.1.3 Set `application_type = 'cold_strategic'` for all imported rows
- [x] 15.1.4 Set `checklist_state = '{}'` for all imported rows
- [x] 15.1.5 Write DOWN block: `DELETE FROM applications WHERE id IN (SELECT id FROM jobs)` (idempotent rollback)

### [x] 15.2 Verify import

- [x] 15.2.1 Confirm row count in `applications` matches row count in `jobs`
- [x] 15.2.2 Spot-check 5–10 records across both tables to verify field mapping
- [x] 15.2.3 Confirm `jobs` table is unchanged after import

### [x] 15.3 Switch frontend to `applications`

- [x] 15.3.1 Remove any remaining references to `/api/jobs` in the frontend
- [x] 15.3.2 Confirm the Applications tab loads data exclusively from `/api/applications`
- [x] 15.3.3 Smoke-test existing records appear correctly in the new Applications tab UI

---

## [ ] Phase 16 — Unified Discover & Watchlist

*Revision to the Phase 5/11 user experience. Keep the existing database model and Radar refresh service. The goal is to make job discovery understandable: watched companies, source setup, refresh state, and discovered postings all live together.*

### [x] 16.1 Combined Discover page

- [x] 16.1.1 Rename the primary `/radar` page experience to a combined Discover workspace; keep the route `/radar`
- [x] 16.1.2 Move the Companies To Watch list into the Discover page as the top section
- [x] 16.1.3 Show discovered postings below the watched-company section, grouped by company and newest first
- [x] 16.1.4 Keep posting actions inline: open posting, add to tracker, dismiss
- [x] 16.1.5 Replace the separate "Companies To Watch" hamburger destination with either a redirect to `/radar` or remove the menu item after the combined page is stable
- [x] 16.1.6 Update empty states so they explain the single flow: add a company, configure a careers source, then refresh to discover matching postings

### [x] 16.2 URL-first source setup

- [x] 16.2.1 Replace the user-facing "board token" language with "Careers source"
- [x] 16.2.2 Add a careers URL input on each watched company
- [x] 16.2.3 Infer `ats_type` and `ats_board_token` from common URL patterns where possible: Greenhouse (`boards.greenhouse.io/<token>`), Lever (`jobs.lever.co/<token>`), Ashby, SmartRecruiters, Pinpoint, and WelcomeKit
- [x] 16.2.4 Keep advanced/manual controls available for cases where inference fails
- [x] 16.2.5 Use `ats_type = custom` with the pasted careers URL for unsupported careers pages
- [x] 16.2.6 Do not add RSS as a primary concept in V2; add a future RSS adapter only if a target company actually requires RSS

### [x] 16.3 Auto-refresh behavior

- [x] 16.3.1 When `/radar` loads, automatically refresh enabled sources that have never refreshed
- [x] 16.3.2 Automatically refresh enabled sources whose `last_refreshed_at` is older than a conservative threshold, initially 30 minutes
- [x] 16.3.3 Do not refresh sources on every render; guard with component state and query status so one page load triggers at most one refresh per stale source
- [x] 16.3.4 Keep the manual Refresh button on each source
- [x] 16.3.5 Show per-source refresh state: idle, refreshing, last refreshed, inserted count, matched count, and error
- [x] 16.3.6 A failed source must not block other sources from refreshing

### [ ] 16.4 Navigation and copy cleanup

- [ ] 16.4.1 Add the combined Discover workflow to primary navigation with clear labeling
- [ ] 16.4.2 Use "Watchlist" or "Watched Companies" inside the page, not hidden navigation
- [ ] 16.4.3 Remove copy that implies Discover is independent from watched companies
- [ ] 16.4.4 Update helper text to say users can paste a company careers URL instead of finding a technical board token first
- [ ] 16.4.5 Confirm mobile layout keeps watched-company controls and discovered postings usable without horizontal page overflow

---

## Rollback Procedures

### Rolling back a single migration

Run the `-- DOWN` block of the migration file in reverse order from where the failure occurred. Example: if v2_006 fails, run DOWN for v2_006, then v2_005 if needed, etc.

### Rolling back the full v2 schema

Run DOWN blocks in reverse order: radar_002 → radar_001 → v2_016 → v2_015 → v2_014 → v2_013 → v2_012 → v2_011 → v2_010 → v2_008 → ... → v2_002 → v2_001. The `jobs` table is untouched throughout; the application can be reverted to v1 by updating the API routes to point back to `jobs`.

### Feature flag approach (optional for production)

To deploy schema changes before UI changes are live, each new API route can check an env var (`FEATURE_V2_ENABLED=true`). This allows the new tables to exist without the frontend consuming them until the flag is enabled.

---

### Rolling back the Job Radar

Run the DOWN block of `radar_001_job_radar.sql` to drop `discovered_postings`, the radar enums, and the added `company_watchlist` columns. The `applications` and `company_watchlist` base tables are otherwise untouched. No V2 background poller is registered; run the DOWN block only.

## Environment Variables (new in v2.0)

Add to `.env.example`:

```env
# Feature flags (optional)
FEATURE_V2_ENABLED=true
```
