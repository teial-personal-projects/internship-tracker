# Track My Application v2.0 — Implementation Plan

**Last updated:** April 28, 2026
**Branch strategy:** Feature branches off `dev`, merged to `dev`, promoted to `main` per phase.
**Migration strategy:** Numbered versioned SQL files in `migrations/`. Each file has an `-- UP` block and a `-- DOWN` block. Run UP sequentially; run DOWN in reverse to rollback.

> **Checkbox legend**
>
> - `[ ]` — not started
> - `[x]` — complete

---

## Phase DR — Design System & Visual Refresh

*Targets the current v1 codebase. No schema, API, or data model changes. Ship as a standalone PR before starting any v2 feature phases. Reference: `docs/DESIGN_SYSTEM.md` — Terracotta Daylight direction.*

### DR.1 Font setup

- [x] DR.1.1 Add to `web/index.html`: Google Fonts preconnect + Mona Sans (wght 400–800) + JetBrains Mono (wght 400–600)
- [x] DR.1.2 Update `--font-family-sans` in `web/src/index.css` to `"Mona Sans", "Inter", -apple-system, sans-serif`
- [x] DR.1.3 Update `--font-family-mono` to `"JetBrains Mono", ui-monospace, monospace`

### DR.2 CSS design tokens

- [x] DR.2.1 Replace the `@theme` block in `web/src/index.css` with the full token set from `DESIGN_SYSTEM.md §2`: surface tokens (`--bg`, `--card`, `--soft`, `--line`, etc.), ink scale (`--ink` through `--ink-4`), terracotta scale (`--accent`, `--accent-dark`, `--accent-soft`, `--accent-tint`), sage, sun, violet, rose
- [x] DR.2.2 Remove the old green `brand-*` palette and blue `accent-*` palette from `@theme`
- [x] DR.2.3 Add shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg` per `DESIGN_SYSTEM.md §4`

### DR.3 Global base styles

- [x] DR.3.1 Update `body` base style: `background: var(--bg)` (`#FBF5EC`), `color: var(--ink)` (`#1B2540`)
- [x] DR.3.2 Add type scale utility classes per `DESIGN_SYSTEM.md §1`: `.text-kicker` (10px / 600 / mono / 0.14em UPPER), `.text-hero`, `.text-section`, `.text-drawer`

### DR.4 Component class updates (`index.css`)

- [x] DR.4.1 `.btn-primary` — terracotta bg (`--accent`), white text, radius 8, inner box-shadow per DS §5
- [x] DR.4.2 `.btn-outline` — white bg, 1px `--line` border, `--ink` text, radius 8
- [x] DR.4.3 `.btn-ghost` — transparent, `--ink-2` text, hover `--softer` bg
- [x] DR.4.4 `.field-input`, `.field-select`, `.field-textarea` — update focus ring and border to `--line` / `--accent`
- [x] DR.4.5 Add `.pill` utility: `padding: 4px 10px; border-radius: 999px; font-weight: 600; font-size: 11px`
- [x] DR.4.6 Add `.card` utility: white bg, 1px `--line` border, radius 16, `--shadow-sm`; hover lifts `translateY(-2px)` + `--shadow-md`

### DR.5 Status and priority color mapping

- [x] DR.5.1 Update `web/src/theme/index.ts` `STATUS_COLORS` to match `DESIGN_SYSTEM.md §3`:
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

- [x] DR.8.1 Add breadcrumb kicker pattern to `DashboardPage.tsx` and `JobBoardsPage.tsx`: small mono label above the page title (e.g. `01 / PIPELINE`)

### DR.9 Unit tests

- [x] DR.9.1 Add `vitest` to `api/package.json` and `web/package.json`; create `vitest.config.ts` in each workspace
- [x] DR.9.2 Unit test: `Avatar` initials — two-word name, single name, three-word name

### DR.10 QA

- [x] DR.10.1 Smoke-test Dashboard, Login, Profile pages in Chrome and Safari
- [x] DR.10.2 Confirm no green `brand-*` color remains in any rendered UI
- [x] DR.10.3 Verify no horizontal overflow at 320px viewport

---

## Phase 0 — Schema & Infrastructure

*All schema work must complete before any feature code is written. The existing `jobs` and `job_boards` tables are never modified. New feature code targets the new `applications` table exclusively. A one-time data import from `jobs` → `applications` runs after all features are complete (see Phase 11). Each migration is a standalone file that can be applied or rolled back independently.*

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
- [x] 0.2.11 Create `notification_type_enum` (`overdue_task`, `upcoming_interview`, `follow_up_due`, `recruiter_no_response`)
- [x] 0.2.12 Write DOWN block: `DROP TYPE IF EXISTS` for each enum in reverse order

### 0.3 Migration v2_002 — `applications` table

File: `migrations/v2_002_applications.sql`

- [x] 0.3.1 Create `applications` table with all columns from PRD §6.1
- [x] 0.3.2 Add `updated_at` trigger (reuse `update_updated_at()` function)
- [x] 0.3.3 Add `auto_applied_date` trigger (same logic as on `jobs`)
- [x] 0.3.4 Create all indexes for `applications` (see PRD §6.2)
- [x] 0.3.5 Write DOWN block: `DROP TABLE IF EXISTS applications CASCADE`

### 0.4 Migration v2_003 — `contacts` table

File: `migrations/v2_003_contacts.sql`

- [x] 0.4.1 Create `contacts` table with all columns from PRD §6.1 — use `first_name` and `last_name` (separate columns, both NOT NULL max 100) instead of a single `full_name` column
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

- [ ] 0.6.1 Create `contact_templates` table
- [ ] 0.6.2 Add `updated_at` trigger
- [ ] 0.6.3 Create indexes
- [ ] 0.6.4 Write DOWN block

### 0.7 Migration v2_006 — `application_contacts` join table

File: `migrations/v2_006_application_contacts.sql`

- [ ] 0.7.1 Create `application_contacts` table with UNIQUE constraint on `(application_id, contact_id)`
- [ ] 0.7.2 Create indexes
- [ ] 0.7.3 Write DOWN block

### 0.8 Migration v2_007 — `tasks` table

File: `migrations/v2_007_tasks.sql`

- [ ] 0.8.1 Create `tasks` table
- [ ] 0.8.2 Add `updated_at` trigger
- [ ] 0.8.3 Create indexes
- [ ] 0.8.4 Write DOWN block

### 0.9 Migration v2_008 — `interviews` table

File: `migrations/v2_008_interviews.sql`

- [ ] 0.9.1 Create `interviews` table
- [ ] 0.9.2 Add `updated_at` trigger
- [ ] 0.9.3 Create indexes
- [ ] 0.9.4 Write DOWN block

### 0.10 Migration v2_009 — `notification_preferences` and `notification_log` tables

File: `migrations/v2_009_notifications.sql`

- [ ] 0.10.1 Create `notification_preferences` table — in-app toggles only (no email, no digest_frequency, no quiet_hours fields)
- [ ] 0.10.2 Add UNIQUE constraint/index on `notification_preferences.user_id`
- [ ] 0.10.3 Add `updated_at` trigger
- [ ] 0.10.4 Create `notification_log` table — stores in-app notifications with `read_at` (nullable); no `email_to` or status fields
- [ ] 0.10.5 Create indexes
- [ ] 0.10.6 Write DOWN block for both tables

> **Note:** `jobs` and `job_boards` tables are untouched by all migrations above. No data is moved until Phase 11.

### 0.11 Migration v2_010 — `company_watchlist` table

File: `migrations/v2_010_company_watchlist.sql`

- [ ] 0.11.1 Create `company_watchlist` table with all columns from PRD §6.1
- [ ] 0.11.2 Add `updated_at` trigger
- [ ] 0.11.3 Create all indexes for `company_watchlist`
- [ ] 0.11.4 Write DOWN block: `DROP TABLE IF EXISTS company_watchlist CASCADE`

### 0.12 Shared types

- [ ] 0.12.1 Update `shared/src/constants.ts` with new field length limits
- [ ] 0.12.2 Create Zod schemas in `shared/src/schemas/` for: `Application`, `Contact`, `ContactInteraction`, `ContactTemplate`, `ApplicationContact`, `Task`, `Interview`, `NotificationPreferences`, `CompanyWatchlistEntry`
- [ ] 0.12.3 Export all schemas from `shared/src/index.ts`

---

## Phase 1 — Navigation & Layout Restructure

*Restructure the shell before adding feature content. This phase is purely frontend.*

### 1.1 Tab bar component

- [ ] 1.1.1 Create `web/src/components/NavBar.tsx` — four primary tabs: Jobs, Contacts, Interviews, Action Items
- [ ] 1.1.2 On desktop (≥768px): horizontal tab bar at the top below the header
- [ ] 1.1.3 On mobile (<768px): fixed bottom navigation bar with icon + label per tab
- [ ] 1.1.4 Active tab state: underline on desktop, filled icon on mobile
- [ ] 1.1.5 Tab bar scrolls horizontally (not wrapping) if viewport is too narrow

### 1.2 Hamburger menu

- [ ] 1.2.1 Create `web/src/components/HamburgerMenu.tsx` — slide-in drawer or dropdown
- [ ] 1.2.2 Menu items: Playbook, Notifications, Profile, Sign out
- [ ] 1.2.3 Hamburger icon in the header top-right; accessible keyboard nav
- [ ] 1.2.4 On mobile: drawer slides in from the right

### 1.3 App header

- [ ] 1.3.1 Update `web/src/components/AppHeader.tsx` to remove Dashboard/Job Boards pills
- [ ] 1.3.2 Show app name, version badge, and user avatar only
- [ ] 1.3.3 Remove all references to the word "Dashboard" from user-facing UI

### 1.4 Routing

- [ ] 1.4.1 Update `web/src/App.tsx` routes: `/jobs`, `/contacts`, `/interviews`, `/action-items`, `/playbook`, `/notifications`, `/profile`
- [ ] 1.4.2 Default route redirects to `/jobs`
- [ ] 1.4.3 Redirect old `/dashboard` and `/job-boards` routes to `/jobs`

### 1.5 Page scaffolding

- [ ] 1.5.1 Create empty page components: `ContactsPage.tsx`, `InterviewsPage.tsx`, `ActionItemsPage.tsx`, `PlaybookPage.tsx`, `NotificationsPage.tsx`
- [ ] 1.5.2 Each page shows a placeholder empty state with a descriptive heading
- [ ] 1.5.3 Verify tab bar active state updates on navigation

---

## Phase 2 — Jobs Tab & Application Type

### 2.1 API — applications route

- [ ] 2.1.1 Create `api/src/routes/applications.ts` mirroring `jobs.ts` but querying the `applications` table
- [ ] 2.1.2 `GET /api/applications` — list with optional `?status`, `?application_type`, `?search`, `?date_from` (ISO date), `?date_to` (ISO date), `?page` (default 1), `?limit` (default 25, max 100) query params; no year constraint; returns `{ data: Application[], total: number, page: number, totalPages: number }`
- [ ] 2.1.3 `POST /api/applications` — create; validate with `CreateApplicationSchema`
- [ ] 2.1.4 `GET /api/applications/:id` — single record with ownership check
- [ ] 2.1.5 `PATCH /api/applications/:id` — partial update; support `application_type` and `checklist_state`
- [ ] 2.1.6 `DELETE /api/applications/:id` — delete with cascade prompt flag in response
- [ ] 2.1.7 Register routes in `api/src/app.ts`: `app.use('/api/applications', applicationsRouter)`

### 2.2 Jobs tab UI

- [ ] 2.2.1 Update `web/src/pages/DashboardPage.tsx` → rename to `JobsPage.tsx`; update all imports
- [ ] 2.2.2 Add date range filter to the search/filter bar: `date_from` and `date_to` date pickers (both optional); filter applies to `applied_date`; no year constraint enforced anywhere
- [ ] 2.2.3 Pipeline conversion bar component showing counts per status stage
- [ ] 2.2.4 Application list: add Application Type tag column and Checklist progress fraction column
- [ ] 2.2.5 Application Type tag: color-coded badge per type (blue/purple/green/gray dashed)
- [ ] 2.2.6 Checklist progress fraction: color-coded (green/amber/red/dash); clickable → navigates to Contacts tab for that application
- [ ] 2.2.7 Urgent tasks widget (top 3 high-priority open tasks) below application list
- [ ] 2.2.8 Create `web/src/components/Pagination.tsx` — previous/next buttons, current page indicator, total pages; props: `page`, `totalPages`, `onPageChange`
- [ ] 2.2.9 Render `<Pagination>` below the application list; reflect `?page=N` in the URL query string for browser back/forward support

### 2.3 Application Type field

- [ ] 2.3.1 Add Application Type dropdown to the Add/Edit application modal
- [ ] 2.3.2 "Not set" shows as gray dashed tag; prompt appears in Jobs tab when any application has `application_type = null`
- [ ] 2.3.3 Changing Application Type triggers checklist recalculation and task cancellation logic (API side)

### 2.4 Checklist

- [ ] 2.4.1 Create `web/src/components/Checklist.tsx` — 18-step checklist with grouped phases: Before you apply, Day 0, Day 4–5 follow-up, After a phone screen
- [ ] 2.4.2 Progress bar + summary label (e.g. "8 of 18 complete")
- [ ] 2.4.3 Steps 6–12 rendered as N/A (muted) when `application_type = recruiter_assisted`
- [ ] 2.4.4 Steps 9–12 rendered as N/A when `application_type = referral`
- [ ] 2.4.5 Each checkbox change PATCHes `checklist_state` on the application record

### 2.5 Unit tests

- [ ] 2.5.1 Unit test: pagination — 26 records with `limit=25` returns `page=1` with 25 items and `totalPages=2`
- [ ] 2.5.2 Unit test: date range filter — records outside `date_from`/`date_to` are excluded; both bounds are inclusive
- [ ] 2.5.3 Unit test: no year constraint — records from multiple calendar years are all returned when no date filter is applied

---

## Phase 3 — Unified Contacts System

### 3.1 API — contacts routes

- [ ] 3.1.1 Create `api/src/routes/contacts.ts`
- [ ] 3.1.2 `GET /api/contacts` — list with `?contact_type`, `?application_id`, `?outreach_status`, `?recruiter_status` filters
- [ ] 3.1.3 `POST /api/contacts` — create; verify `application_id` ownership if provided
- [ ] 3.1.4 `GET /api/contacts/:id` — ownership check
- [ ] 3.1.5 `PATCH /api/contacts/:id` — update; on `outreach_status → double_down_sent`, auto-create follow-up task
- [ ] 3.1.6 `DELETE /api/contacts/:id` — cascade delete interactions and templates
- [ ] 3.1.7 `POST /api/contacts/:id/interactions` — append interaction log entry
- [ ] 3.1.8 `GET /api/contacts/:id/interactions` — list entries, ordered by `occurred_at DESC`
- [ ] 3.1.9 `POST /api/contacts/:id/templates` — attach template
- [ ] 3.1.10 `PATCH /api/contacts/:id/templates/:tid` — update template
- [ ] 3.1.11 `DELETE /api/contacts/:id/templates/:tid` — delete template
- [ ] 3.1.12 `POST /api/applications/:id/contacts` — link recruiter contact to application
- [ ] 3.1.13 `DELETE /api/applications/:id/contacts/:cid` — unlink recruiter from application
- [ ] 3.1.14 Register in `app.ts`

### 3.2 Business logic — auto task creation

- [ ] 3.2.1 Create `api/src/services/taskAutoGeneration.ts`
- [ ] 3.2.2 `createDoubleDownFollowUpTask(contactId, userId, applicationId)` — creates follow-up task with `due_date = today + 4 business days`
- [ ] 3.2.3 `createApplicationDoubleDownTask(applicationId, userId)` — task for cold_strategic on applied status
- [ ] 3.2.4 Helper: `addBusinessDays(date, days)` — skips Sat/Sun
- [ ] 3.2.5 Unit tests for `addBusinessDays` — weekends skipped, multi-week spans, spans that start on a Friday
- [ ] 3.2.6 Unit test: `createDoubleDownFollowUpTask` sets `due_date` to exactly today + 4 business days
- [ ] 3.2.7 Unit test: `createApplicationDoubleDownTask` does not fire when `application_type` is not `cold_strategic`

### 3.3 Contacts tab UI

- [ ] 3.3.1 Create `web/src/pages/ContactsPage.tsx`
- [ ] 3.3.2 Contact list view: rows show contact_type badge, name, title/agency, linked company, outreach/recruiter status, date of last outreach
- [ ] 3.3.3 Filter bar: contact_type toggle (All / Company / Recruiter), outreach_status filter, recruiter_status filter
- [ ] 3.3.4 Search by contact name or company
- [ ] 3.3.5 Sort controls: status, company, date added, date of last outreach
- [ ] 3.3.6 Color-coded outreach status tags per PRD §2.8
- [ ] 3.3.7 Add Contact button — opens modal with contact_type selector; form fields change based on type
- [ ] 3.3.8 Company contact form fields: application selector, outreach_status, how_found
- [ ] 3.3.9 Recruiter form fields: agency, preferred_contact_method, recruiter_status

### 3.4 Contact detail panel

- [ ] 3.4.1 Clicking a contact row expands an inline detail panel (or modal on mobile)
- [ ] 3.4.2 Panel shows all fields, interaction log (reverse chronological), templates list
- [ ] 3.4.3 Quick-action: update outreach status from the panel
- [ ] 3.4.4 Interaction log entry form: purpose dropdown + body text field + occurred_at (defaults to now)
- [ ] 3.4.5 Templates section: list existing templates; Add Template button opens inline form
- [ ] 3.4.6 Template form: name, template_type dropdown, body rich text

### 3.5 Per-application contacts panel (within Contacts tab)

- [ ] 3.5.1 When navigating to Contacts tab from a Jobs tab row, the Contacts tab pre-filters to that application
- [ ] 3.5.2 Application header card: shows company, role, Application Type tag, checklist progress
- [ ] 3.5.3 Contacts sub-panel: list of contacts linked to that application with name, role, outreach status, quick-action button
- [ ] 3.5.4 + Add Contact button scoped to that application
- [ ] 3.5.5 Linked recruiters section: list of recruiter contacts linked via `application_contacts`

---

## Phase 4 — Action Items & Task Queue

### 4.1 API — tasks routes

- [ ] 4.1.1 Create `api/src/routes/tasks.ts`
- [ ] 4.1.2 `GET /api/tasks` — list with `?category`, `?priority`, `?status`, `?application_id` filters; default sort: priority high→low, due_date asc
- [ ] 4.1.3 `POST /api/tasks` — manual creation; verify linked application/contact ownership
- [ ] 4.1.4 `GET /api/tasks/:id` — ownership check
- [ ] 4.1.5 `PATCH /api/tasks/:id` — update status, priority, due_date, notes
- [ ] 4.1.6 `DELETE /api/tasks/:id` — ownership check
- [ ] 4.1.7 Register in `app.ts`

### 4.2 Overdue escalation job

- [ ] 4.2.1 Create `api/src/jobs/escalateOverdueTasks.ts`
- [ ] 4.2.2 Query all open tasks where `due_date < today`
- [ ] 4.2.3 Set `priority = high` and append `(Overdue)` to title if not already present
- [ ] 4.2.4 Schedule via cron (daily at 00:05 UTC) — use `node-cron` or equivalent
- [ ] 4.2.5 Register job startup in `api/src/index.ts`
- [ ] 4.2.6 Unit test: tasks past `due_date` have `priority` set to `high` and `(Overdue)` appended to title
- [ ] 4.2.7 Unit test: `(Overdue)` is not appended a second time if already present in the title

### 4.3 Action Items tab UI

- [ ] 4.3.1 Create `web/src/pages/ActionItemsPage.tsx`
- [ ] 4.3.2 Task list: grouped sections Open and Done
- [ ] 4.3.3 Each row: priority indicator dot, title, category badge, linked company name, due date, countdown, application_type secondary label
- [ ] 4.3.4 Quick-complete checkbox — single click marks `status = complete`, moves to Done section
- [ ] 4.3.5 Filter bar: category, priority, status (open/done/skipped), due date range
- [ ] 4.3.6 Group by toggle: company, category, due date
- [ ] 4.3.7 Add Task button — opens modal with all task fields; application and contact selectors
- [ ] 4.3.8 Overdue tasks: highlighted row with red "Overdue" label

### 4.4 Jobs tab widget

- [ ] 4.4.1 Create `web/src/components/UrgentTasksWidget.tsx`
- [ ] 4.4.2 Shows top 3 open high-priority tasks with title, company, due date
- [ ] 4.4.3 "View all" link → navigates to Action Items tab
- [ ] 4.4.4 Updates in real time on task status change (re-fetch on focus or after mutation)

---

## Phase 5 — Interview Tracker

### 5.1 API — interviews routes

- [ ] 5.1.1 Create `api/src/routes/interviews.ts`
- [ ] 5.1.2 `GET /api/interviews` — list with `?type`, `?status`, `?application_id` filters; sorted by `scheduled_at ASC`
- [ ] 5.1.3 `POST /api/interviews` — create; triggers checklist advance and auto-task creation on insert
- [ ] 5.1.4 `GET /api/interviews/:id` — ownership check
- [ ] 5.1.5 `PATCH /api/interviews/:id` — update fields, status, outcome
- [ ] 5.1.6 `DELETE /api/interviews/:id` — ownership check
- [ ] 5.1.7 Register in `app.ts`

### 5.2 Interview business logic service

- [ ] 5.2.1 Create `api/src/services/interviewTriggers.ts`
- [ ] 5.2.2 `onInterviewCreated(interview, userId)` — dispatches checklist advance and task creation
- [ ] 5.2.3 Checklist advance: update `checklist_state` on the linked application per PRD §5.6 rules
- [ ] 5.2.4 Task creation: create prep and reminder tasks per PRD §5.6 table
- [ ] 5.2.5 Call this service from the POST /api/interviews handler after successful insert
- [ ] 5.2.6 Unit test: `onInterviewCreated` with `phone_screen` creates a prep task (due 1 day before) and a thank-you task (due same day as interview)
- [ ] 5.2.7 Unit test: `onInterviewCreated` with `technical` creates a review-topics task (due 2 days before) and no thank-you task
- [ ] 5.2.8 Unit test: `onInterviewCreated` with any type advances `checklist_state` step 15 on the linked application

### 5.3 Global Interviews tab UI

- [ ] 5.3.1 Create `web/src/pages/InterviewsPage.tsx`
- [ ] 5.3.2 Two sections: Upcoming (sorted asc) and Completed (muted, sorted desc)
- [ ] 5.3.3 Filter bar: All, Phone Screen, Technical, On Site, Final Round — each with count badge
- [ ] 5.3.4 Each row: completion checkbox, interview type badge, company logo/initials, company, role title, Application Type tag, countdown label
- [ ] 5.3.5 Clicking a row expands an inline detail panel: scheduled date/time, interviewer, location/link, notes, outcome
- [ ] 5.3.6 Prep reminder callout at top of tab when any interview is within 24 hours
- [ ] 5.3.7 Completing an interview (checkbox click): prompts for outcome before marking done

### 5.4 Per-application interview panel

- [ ] 5.4.1 Add Interviews sub-panel to the application detail section in the Contacts tab
- [ ] 5.4.2 Compact row per interview: type badge, date/time, interviewer, countdown
- [ ] 5.4.3 "Not yet scheduled" placeholder for future stages
- [ ] 5.4.4 + Add Interview button — opens modal pre-populated with the current application

---

## Phase 6 — In-App Notifications

*No email sending in v2.0. Notifications are written to `notification_log` at the moment triggering events occur. Email delivery is deferred to v3.0 — see `implementation-plan-v3.md`.*

### 6.1 API — notifications routes

- [ ] 6.1.1 Create `api/src/routes/notifications.ts`
- [ ] 6.1.2 `GET /api/notifications` — list notifications for req.user.id; support `?unread_only=true` filter
- [ ] 6.1.3 `PATCH /api/notifications/read` — mark all notifications read for req.user.id (sets `read_at = now()`)
- [ ] 6.1.4 `PATCH /api/notifications/:id/read` — mark a single notification read; ownership check
- [ ] 6.1.5 `GET /api/notifications/preferences` — return preferences for req.user.id (or defaults if none exist)
- [ ] 6.1.6 `PUT /api/notifications/preferences` — upsert notification preferences; validate with Zod schema
- [ ] 6.1.7 Register in `app.ts`

### 6.2 Notification creation service

- [ ] 6.2.1 Create `api/src/services/notificationService.ts` — `createNotification(userId, type, entityId, message)`
- [ ] 6.2.2 Before inserting, check `notification_preferences.enabled` and the relevant type toggle; skip if off
- [ ] 6.2.3 Deduplicate: skip insert if an unread notification for the same `(user_id, notification_type, entity_id)` already exists
- [ ] 6.2.4 Call `createNotification` from existing trigger points: task auto-generation service, overdue escalation job, interview trigger service
- [ ] 6.2.5 Unit test: `createNotification` skips insert when an unread notification for the same `(user_id, notification_type, entity_id)` already exists
- [ ] 6.2.6 Unit test: `createNotification` skips insert when `notification_preferences.enabled = false`
- [ ] 6.2.7 Unit test: `createNotification` skips insert when the relevant type toggle (e.g. `notify_overdue_tasks`) is false even if the master toggle is on

### 6.3 Notification bell UI (header)

- [ ] 6.3.1 Add bell icon to `web/src/components/AppHeader.tsx`
- [ ] 6.3.2 Fetch unread count from `GET /api/notifications?unread_only=true` on mount and on tab focus
- [ ] 6.3.3 Show red badge with count when unread count > 0; hide badge when count is 0
- [ ] 6.3.4 Clicking bell opens a dropdown panel (max 300px wide, max 400px tall, scrollable)
- [ ] 6.3.5 Panel lists up to 20 most recent notifications: type icon, message, relative timestamp, navigation link
- [ ] 6.3.6 Opening panel calls `PATCH /api/notifications/read` to mark all read and clear badge
- [ ] 6.3.7 Each notification row is a link — clicking navigates to the relevant application, task, or interview

### 6.4 Notification preferences UI

- [ ] 6.4.1 Create `web/src/pages/NotificationsPage.tsx`
- [ ] 6.4.2 Master on/off toggle — disables all other controls when off
- [ ] 6.4.3 Individual toggles: overdue tasks, upcoming interviews, follow-up due, recruiter no response
- [ ] 6.4.4 Save button PUTs to `/api/notifications/preferences`
- [ ] 6.4.5 Success/error toast on save
- [ ] 6.4.6 Page accessible from hamburger menu → Notification settings

---

## Phase 7 — Playbook Page

### 7.1 Playbook content

- [ ] 7.1.1 Create `web/src/pages/PlaybookPage.tsx`
- [ ] 7.1.2 Render all 7 sections from PRD §7 as a scrollable, readable reference page
- [ ] 7.1.3 Sections: 4-step process, Cover letter writing guide, Where to apply, Double-down email, Follow-up email, Using templates, Per-application checklist reference
- [ ] 7.1.4 Step 2 heading explicitly labels the "in" as "the cover letter differentiator"
- [ ] 7.1.5 Template section: links to the Contacts tab with a "Manage your templates →" CTA
- [ ] 7.1.6 Checklist section: read-only numbered reference (no interactive checkboxes); CTA links to the application's checklist in the Contacts tab
- [ ] 7.1.7 Page is accessible from the hamburger menu only — not a primary tab

### 7.2 Mobile layout

- [ ] 7.2.1 Playbook stacks to single-column on viewports below 768px
- [ ] 7.2.2 Tables reflow to card layout or horizontal scroll on mobile
- [ ] 7.2.3 Sticky section nav (optional for desktop; hidden on mobile)

---

## Phase 8 — Companies To Watch

### 8.1 API — watchlist routes

- [ ] 8.1.1 Create `api/src/routes/watchlist.ts`
- [ ] 8.1.2 `GET /api/watchlist` — list with `?search`, `?priority`, `?target_apply_year` filters; ordered by `added DESC`
- [ ] 8.1.3 `POST /api/watchlist` — create entry; validate with `CreateWatchlistEntrySchema`
- [ ] 8.1.4 `GET /api/watchlist/:id` — ownership check
- [ ] 8.1.5 `PATCH /api/watchlist/:id` — update fields
- [ ] 8.1.6 `DELETE /api/watchlist/:id` — ownership check
- [ ] 8.1.7 `POST /api/watchlist/:id/promote` — create an `applications` record from `company_name` and `industry`; delete the watchlist entry; return the new application ID
- [ ] 8.1.8 Register in `app.ts`
- [ ] 8.1.9 Unit test: `promote` returns the new application ID and the watchlist entry no longer exists after the call
- [ ] 8.1.10 Unit test: `promote` on a non-existent entry returns 404; on another user's entry returns 403

### 8.2 Companies To Watch UI

- [ ] 8.2.1 Create `web/src/pages/WatchlistPage.tsx`
- [ ] 8.2.2 List view: rows show company name, industry badge, priority dot, target apply year, one-line notes preview
- [ ] 8.2.3 Search bar: filter by company name as user types
- [ ] 8.2.4 Filter controls: priority dropdown, target apply year input
- [ ] 8.2.5 Sort controls: date added, company name, priority, target apply year
- [ ] 8.2.6 Add Company button — opens modal with all watchlist entry fields
- [ ] 8.2.7 Edit action on each row — opens prefilled modal
- [ ] 8.2.8 Delete action — single confirmation prompt before removal
- [ ] 8.2.9 "Start Application" button on each row — calls `POST /api/watchlist/:id/promote`; on success, navigate to the new application in the Jobs tab
- [ ] 8.2.10 Empty state: instructional text explaining the purpose of the list with a primary "Add a Company" CTA
- [ ] 8.2.11 Add `/watchlist` route to `web/src/App.tsx`
- [ ] 8.2.12 Add "Companies To Watch" item to `HamburgerMenu.tsx` linking to `/watchlist`

---

## Phase 9 — Mobile Polish & Cross-Browser QA

- [ ] 9.1 Verify all pages render correctly on iPhone 14 viewport (390×844)
- [ ] 9.2 Verify all pages render correctly on Android mid-range viewport (360×780)
- [ ] 9.3 Bottom navigation bar is fixed and does not overlap content on any mobile viewport
- [ ] 9.4 Modals and drawers are full-screen on mobile
- [ ] 9.5 All form inputs are at least 44px tap target height
- [ ] 9.6 Touch scrolling works on all lists (application list, contact list, task list, interview list, watchlist)
- [ ] 9.7 Filter bars scroll horizontally on mobile without wrapping
- [ ] 9.8 Checklist checkboxes are tappable on mobile
- [ ] 9.9 Empty states display correctly on all viewports
- [ ] 9.10 Test in Chrome, Firefox, and Safari (desktop)
- [ ] 9.11 Verify no horizontal overflow on any page at 320px viewport width

---

## Phase 10 — Final Wiring & End-to-End Testing

- [ ] 10.1 Final end-to-end test: add application → set type → add contact → update outreach status → verify task auto-created → mark task complete → add interview → verify checklist auto-advanced
- [ ] 10.2 End-to-end test: add company to watchlist → promote to application → verify application appears in Jobs tab and watchlist entry is removed
- [ ] 10.3 Verify date range filter returns only records with applied_date within the specified range; verify empty result when no records match
- [ ] 10.4 Verify pagination: 26 records return page 1 (25 records) and page 2 (1 record) with correct `totalPages`

---

## Phase 11 — Data Import from `jobs` table

*Run this phase only after all features are complete and tested. The `jobs` table is read-only during this step — no records are deleted or modified.*

### 11.1 Write import migration

File: `migrations/v2_011_import_jobs.sql`

- [ ] 11.1.1 Write `INSERT INTO applications (...) SELECT ... FROM jobs` mapping all overlapping columns
- [ ] 11.1.2 Map `job_status_enum` values to `application_status_enum` equivalents
- [ ] 11.1.3 Set `application_type = NULL` for all imported rows (user can set type after import)
- [ ] 11.1.4 Set `checklist_state = '{}'` for all imported rows
- [ ] 11.1.5 Write DOWN block: `DELETE FROM applications WHERE id IN (SELECT id FROM jobs)` (idempotent rollback)

### 11.2 Verify import

- [ ] 11.2.1 Confirm row count in `applications` matches row count in `jobs`
- [ ] 11.2.2 Spot-check 5–10 records across both tables to verify field mapping
- [ ] 11.2.3 Confirm `jobs` table is unchanged after import

### 11.3 Switch frontend to `applications`

- [ ] 11.3.1 Remove any remaining references to `/api/jobs` in the frontend
- [ ] 11.3.2 Confirm the Jobs tab loads data exclusively from `/api/applications`
- [ ] 11.3.3 Smoke-test existing records appear correctly in the new Jobs tab UI

---

## Rollback Procedures

### Rolling back a single migration

Run the `-- DOWN` block of the migration file in reverse order from where the failure occurred. Example: if v2_006 fails, run DOWN for v2_006, then v2_005 if needed, etc.

### Rolling back the full v2 schema

Run DOWN blocks in reverse order: v2_010 → v2_009 → v2_008 → ... → v2_002 → v2_001. The `jobs` table is untouched throughout; the application can be reverted to v1 by updating the API routes to point back to `jobs`.

### Feature flag approach (optional for production)

To deploy schema changes before UI changes are live, each new API route can check an env var (`FEATURE_V2_ENABLED=true`). This allows the new tables to exist without the frontend consuming them until the flag is enabled.

---

## Environment Variables (new in v2.0)

Add to `.env.example`:

```env
# Feature flags (optional)
FEATURE_V2_ENABLED=true
```
