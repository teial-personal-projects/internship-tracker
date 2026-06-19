# Track My Application v2.1 — Implementation Plan

**Last updated:** June 18, 2026
**Branch strategy:** Feature branches off `dev`, merged to `dev`, promoted to `main` per phase.
**Migration strategy:** Continue numbered SQL files in `migrations/`. v2.1 starts at `v2_017`.

> **Checkbox legend**
>
> - `[ ]` not started
> - `[x]` complete

## Scope

v2.1 is a focused visual and information-architecture update:

- Add a new **Today** tab and make it the post-login landing page.
- Rebuild the **Applications** tab into a compact list plus right-rail layout.
- Keep the existing **Discover & Watchlist** tab from Phase 16 intact.
- Add only read-oriented API support and supporting indexes.

The intended look is warmer, denser, and more executive-dashboard-like than v2.0: cream page background, compact top navigation, large greeting, flat stat cards, structured panels, and quiet right rails. The screenshot’s Recruitments and Interviews nav items are visual direction only. Playbook is pulled forward in Phase 7 as a read-only primary tab.

## Non-Goals

- No new write workflows for interviews.
- No Recruitments tab.
- No notifications or email preference work.
- No new tables or columns.
- No colored initial squares in the Today or rebuilt Applications surfaces.

---

## [ ] Phase 0 — Schema And Migrations

v2.1 adds only supporting indexes. Apply this before feature code so the new read paths are indexed from day one.

### [x] 0.1 Confirm Existing Data Model

- [x] 0.1.1 Confirm every Today and Applications panel maps to an existing table and column using the verification table below.
- [x] 0.1.2 Confirm the Applications title field is `applications.title`; do not use `role`.
- [x] 0.1.3 Confirm `tasks` is the action-items table and supports `status = 'complete'` via the existing `PATCH /api/tasks/:id`.
- [x] 0.1.4 Confirm `application_events` is the activity log and carries `occurred_at`, `event_type`, `application_id`, and `user_id`.
- [x] 0.1.5 Confirm `interviews` remains read-only in v2.1.

| Panel | Source table(s) | Key columns |
| --- | --- | --- |
| Greeting and stats | `applications`, `tasks`, `interviews`, `contacts` | counts only |
| Up next | `interviews` joined to `applications` | `scheduled_at`, `status`, `interview_type`, `interviewer_names`, `location_link`, `notes`, `company`, `title` |
| Action items | `tasks` joined to `applications` and `contacts` | `status`, `priority`, `due_date`, `application_id`, `contact_id`, `title` |
| Need attention | `applications` | `status`, `updated_at`, `application_type`, `company`, `title` |
| Funnel | `applications` | `status` |
| Overdue follow-ups | `contacts` | `outreach_status`, `date_of_last_outreach`, `company`, `agency` |
| Recent contacts | `contacts` | `date_of_last_outreach`, `outreach_status`, `recruiter_status` |
| Applications list | `applications` | `company`, `title`, `status`, `applied_date`, `application_type`, `location` |
| Applications rail: pipeline | `applications` | `status` |
| Applications rail: activity | `application_events` joined to `applications` | `user_id`, `occurred_at`, `event_type`, `application_id`, `company`, `title` |

### [x] 0.2 Migration v2_017 — Supporting Indexes

Dev/local file: `migrations/v2_017_today_indexes.sql`
Production-only file: `migrations/v2_017_today_indexes_PROD_ONLY.sql`

- [x] 0.2.1 Create the migration file with `-- UP` and `-- DOWN` blocks.
- [x] 0.2.2 Use `CREATE INDEX IF NOT EXISTS` for idempotency.
- [x] 0.2.3 Create a production-only companion file that uses `CREATE INDEX CONCURRENTLY`; run each statement one at a time outside a transaction.
- [x] 0.2.4 Apply UP to dev and confirm the Today and Applications queries are covered by indexes.
- [x] 0.2.5 Confirm DOWN drops only indexes created by this file and touches no data.

### [x] 0.3 Shared Read Model Types

- [x] 0.3.1 Add `TodayPayloadSchema` to `shared/src/schemas.ts` and export its TypeScript type.
- [x] 0.3.2 Reuse existing `Application`, `Task`, `Contact`, and `ApplicationEvent` schemas for nested records where practical.
- [x] 0.3.3 Add focused nested DTO schemas only where the API returns joined display fields such as `application_company`, `application_title`, or `contact_name`.

---

## [ ] Phase 1 — Shared Read Layer

Build the read paths once so Today and Applications stay consistent.

### [x] 1.1 Theme Reuse

- [x] 1.1.1 Reuse `STATUS_COLORS` and `STATUS_LABELS` from `web/src/theme/index.ts`; do not create a second status color map.
- [x] 1.1.2 Fix priority color usage to support the real enum values `high`, `medium`, and `low`; avoid introducing `med` in new UI.
- [x] 1.1.3 Add a neutral avatar/initials variant for rail contacts if needed; do not use filled colored initial squares.

### [x] 1.2 Pipeline Counts Helper

- [x] 1.2.1 Add one API helper, `getPipelineCounts(db, userId)`, that returns status counts from `applications`.
- [x] 1.2.2 Today buckets the counts into Applied, Phone screen, Technical, and Final/offer.
- [x] 1.2.3 Applications rail shows full status granularity.
- [x] 1.2.4 Unit test: counts are scoped to the requesting user and sum to that user's total applications.

### [x] 1.3 Today Aggregate Endpoint

- [x] 1.3.1 Create `api/src/routes/today.ts` with `GET /api/today`.
- [x] 1.3.2 Register the route in `api/src/app.ts` with `app.use('/api/today', todayRouter)`.
- [x] 1.3.3 Return one `TodayPayload` containing stats, up next, action items, need attention, funnel, overdue follow-ups, and recent contacts.
- [x] 1.3.4 Scope every query by `user_id`; joined application and contact records must also belong to the current user.
- [x] 1.3.5 Cap panel lists with explicit limits.
- [x] 1.3.6 Unit test: a user with no data gets zero counts and empty arrays, never null panel objects.

### [x] 1.4 Applications Activity Endpoint

- [x] 1.4.1 Add `GET /api/applications/activity` returning recent `application_events` joined to owned `applications`.
- [x] 1.4.2 Sort by `application_events.occurred_at DESC` and cap at 6.
- [x] 1.4.3 Return `event_type`, `occurred_at`, `body`, `application_id`, `company`, and `title`.
- [x] 1.4.4 Unit test: activity only includes events for applications owned by the requesting user.

---

## [ ] Phase 2 — Today Tab

Create the new post-login landing page. Match the intended visual direction without adding the deferred tabs.

### [x] 2.1 Route And Default Landing

- [x] 2.1.1 Add `Today` as the first primary tab in `web/src/components/NavBar.tsx`.
- [x] 2.1.2 Add `/today` route in `web/src/App.tsx`.
- [x] 2.1.3 Change `/` and the authenticated default redirect from `/applications` to `/today`.
- [x] 2.1.4 Keep `/applications` directly reachable.
- [x] 2.1.5 Keep `/interviews` and `/notifications` redirected; Playbook is pulled forward in Phase 7.

### [x] 2.2 Page Scaffold

- [x] 2.2.1 Create `web/src/pages/TodayPage.tsx`.
- [x] 2.2.2 Fetch `GET /api/today` once on load using the existing React Query pattern.
- [x] 2.2.3 Use a two-column layout: main content and a right rail; stack the rail below the main column under 768px.
- [x] 2.2.4 Show one page-level loading state and one page-level error state.
- [x] 2.2.5 Preserve mobile bottom navigation spacing with `mobile-safe-bottom`.

### [x] 2.3 Greeting And Summary

- [x] 2.3.1 Render "Good morning, {first name}." and accent the first name with the app accent color.
- [x] 2.3.2 Build the summary from interviews today, open tasks, and overdue contacts.
- [x] 2.3.3 Omit zero-value clauses from the summary.
- [x] 2.3.4 Empty summary: "You're all caught up. Nothing needs you today."

### [x] 2.4 Flat Stat Cards

- [x] 2.4.1 Create `web/src/components/today/StatCards.tsx`.
- [x] 2.4.2 Render four flat cards: Applications, Phone screens, Open tasks, and Interviews this week.
- [x] 2.4.3 Cards use a white surface, 1px `--line` border, muted label, and large number.
- [x] 2.4.4 Do not add corner color blocks, triangles, or decorative blobs.
- [x] 2.4.5 Show `0` and a muted hint for empty card values.

### [x] 2.5 Up Next

- [x] 2.5.1 Create `web/src/components/today/UpNextCard.tsx`.
- [x] 2.5.2 Source the single next scheduled interview from `interviews`.
- [x] 2.5.3 Show time, interview type, company, title, interviewer names, Join button when `location_link` exists, and Prep notes when `notes` exists.
- [x] 2.5.4 Empty state: show a slim "No interviews scheduled." line.

### [x] 2.6 Action Items

- [x] 2.6.1 Create `web/src/components/today/ActionItemsPanel.tsx`.
- [x] 2.6.2 Source open `tasks`, sorted by priority then due date.
- [x] 2.6.3 Each row shows a checkbox, task title, linked company/contact context, due label, and priority pill.
- [x] 2.6.4 Checking a task calls the existing task PATCH with `status = 'complete'` and removes it from the list.
- [x] 2.6.5 Header count is total open tasks, not just the rendered limit.
- [x] 2.6.6 Empty state: "No open action items."

### [x] 2.7 show the user's most recently updated active applications

Purpose: show the user's most recently updated active applications so the Today page surfaces work already in motion. This is not an alert system; it is a compact "what is currently active" panel, ordered by recency, with enough context to decide what to open next.

- [x] 2.7.1 Create `web/src/components/today/NeedAttentionPanel.tsx`.
- [x] 2.7.2 Source active applications ordered by `updated_at DESC`.
- [x] 2.7.3 Include applications in `in_progress`, `applied`, `screening`, `interviewing`, `technical`, `on_site`, and `final_round`.
- [x] 2.7.4 Add a no-type nudge only if the schema or data allows `application_type IS NULL`; current v2.0 defaults it to `cold_strategic`, so this may be zero forever.
- [x] 2.7.5 Empty state: "Nothing in active stages right now."

### [x] 2.8 Funnel

Purpose: show a compact conversion snapshot for the current application cycle. The rows are cumulative stage-reached counts, so a final-round application also counts toward Applied, Phone screen, and Technical. Percentages use Applied as the denominator to answer "how far is the pipeline progressing?"

- [x] 2.8.1 Create `web/src/components/today/FunnelPanel.tsx`.
- [x] 2.8.2 Bucket status counts into cumulative rows: Applied, Phone screen, Technical, and Final/offer.
- [x] 2.8.3 Use Applied as the denominator and guard divide-by-zero.
- [x] 2.8.4 Render count and percentage for each row; percentages must be `0` when there is no Applied denominator.
- [x] 2.8.5 Empty state: "No applications in this cycle yet."

### [x] 2.9 Overdue Follow-Ups

- [x] 2.9.1 Create `web/src/components/today/OverdueFollowupsPanel.tsx`.
- [x] 2.9.2 Use contacts with `outreach_status IN ('applied_msg_sent', 'double_down_sent', 'follow_up_sent')`.
- [x] 2.9.3 Treat contacts as overdue when `date_of_last_outreach` is older than 7 days.
- [x] 2.9.4 Put the 7-day threshold in one constant.
- [x] 2.9.5 Use thin monochrome initials circles, not colored squares.
- [x] 2.9.6 Empty state: "You're current on follow-ups."
- [x] 2.9.7 Leave a short code comment noting exact recency can later use `MAX(contact_interactions.occurred_at)`.

### [x] 2.10 Recent Contacts

- [x] 2.10.1 Create `web/src/components/today/RecentContactsPanel.tsx`.
- [x] 2.10.2 Order contacts by `date_of_last_outreach DESC NULLS LAST`.
- [x] 2.10.3 Each row shows neutral initials, name, title, company or agency, and outreach/recruiter status.
- [x] 2.10.4 Empty state: "No contacts yet."

### [x] 2.11 Today Tests

- [x] 2.11.1 Summary line omits zero-valued clauses.
- [x] 2.11.2 Funnel rows are monotonically non-increasing for any status distribution.
- [x] 2.11.3 Overdue follow-ups exclude contacts inside the threshold and closed statuses.
- [x] 2.11.4 Up-next returns the soonest future scheduled interview and excludes past interviews.

---

## [ ] Phase 3 — Applications Tab Rebuild

Replace the wide table/card split with a compact list plus a right rail. Preserve existing filters, actions, pagination, and write paths.

### [x] 3.1 Compact List Rows

- [x] 3.1.1 Rebuild the Applications list row at roughly 48px height.
- [x] 3.1.2 Row content: thin status-colored left bar, company as primary text, title as muted secondary text.
- [x] 3.1.3 Sub-line: status badge, `applied_date` or "Not applied", and location separated by middots.
- [x] 3.1.4 Status bar color comes from `STATUS_COLORS`; avoid extra row color.
- [x] 3.1.5 Keep Edit and delete controls without changing existing write paths.

### [x] 3.2 Remove Colored Initial Squares

- [x] 3.2.1 Remove colored company/contact initial squares from Applications list surfaces.
- [x] 3.2.2 If a marker still helps in the rail, use a neutral outline avatar variant.

### [x] 3.3 Right Rail

- [x] 3.3.1 Add `web/src/components/applications/ApplicationsRail.tsx`.
- [x] 3.3.2 Rail stacks below the list under 768px.
- [x] 3.3.3 Mini pipeline card shows status label, color dot, and count from shared pipeline counts.
- [x] 3.3.4 Clicking a pipeline row sets the `status` filter; clicking the active row clears it.
- [x] 3.3.5 Recent activity card uses `GET /api/applications/activity`.
- [x] 3.3.6 Activity lines show company, event label, optional body snippet, and relative time.
- [x] 3.3.7 Keep an "applications have no type set" nudge only if the count is greater than zero.

### [x] 3.4 Preserve Filters, Search, And Pagination

- [x] 3.4.1 Existing search, date range, type filter, status filter, page, and limit query params continue to drive `GET /api/applications`.
- [x] 3.4.2 Status filtering is also wired to rail clicks.
- [x] 3.4.3 Pagination still shows the correct item range and reflects `?page=N`.
- [x] 3.4.4 No year dropdown comes back.

### [x] 3.5 Empty States

- [x] 3.5.1 No applications: list area shows onboarding prompt with Add button; rail shows zeros.
- [x] 3.5.2 Filtered empty state: show "No applications match these filters" and a Clear filters action.
- [x] 3.5.3 Pipeline statuses with zero count still render muted.

### [x] 3.6 Applications Tests

- [x] 3.6.1 Clicking a pipeline row sets the status filter; clicking it again clears it.
- [x] 3.6.2 Activity rail shows only events for owned applications.
- [x] 3.6.3 Compact row renders "Not applied" for null `applied_date`.

---

## [x] Phase 4 — QA And Cross-Browser

- [x] 4.1 Today and Applications render correctly at 390x844 and 360x780; rails stack below content.
- [x] 4.2 No horizontal page overflow at 320px on either tab.
- [x] 4.3 Test Chrome, Firefox, and Safari desktop.
- [x] 4.4 All-zero account shows empty states and no null text.
- [x] 4.5 `/today` is the post-login default and `/applications` still loads directly.
- [x] 4.6 No colored initial squares remain in Today or rebuilt Applications.
- [x] 4.7 Stat cards render flat with no corner accents.
- [x] 4.8 Re-run Applications regression checks: pagination math, inclusive date range, multi-year results with no date filter.

---

## [ ] Phase 5 — Applications Grid And Kanban Views

Add a view toggle to keep the current sortable Applications grid while introducing a Kanban board for workflow movement. The two views must share filters, search, status rail behavior, edit/delete actions, and application status persistence.

### [x] 5.1 View Toggle

- [x] 5.1.1 Add a segmented control in the Applications toolbar with `Grid` and `Kanban`.
- [x] 5.1.2 Default to `Grid` so the current sortable table remains the primary view.
- [x] 5.1.3 Persist the selected view in the URL query string as `view=grid|kanban`.
- [x] 5.1.4 Preserve existing query params when switching views: search, type, status, date range, sort, page, and limit.
- [x] 5.1.5 Direct links to `/applications?view=kanban` open the Kanban view without losing filters.

### [x] 5.2 Grid View Preservation

- [x] 5.2.1 Keep the current desktop table/grid with sortable headers for Application, Status, Applied, Added, and Location.
- [x] 5.2.2 Keep the mobile card list for `Grid` view.
- [x] 5.2.3 Keep server-side sorting and pagination behavior unchanged in `Grid` view.
- [x] 5.2.4 Keep edit and delete actions available in each grid row/card.

### [x] 5.3 Kanban Data And Columns

- [x] 5.3.1 Create `web/src/components/applications/ApplicationsKanbanBoard.tsx`.
- [x] 5.3.2 Columns map to top-level workflow statuses: Not Started, In Progress, Applied, Interviewing, On Site, Offered, and Rejected. Existing `screening`, `technical`, and `final_round` applications display in Interviewing; existing `withdrawn` and `archive` applications display in Rejected.
- [x] 5.3.3 Render zero-count columns as muted empty lanes so users can drag into them.
- [x] 5.3.4 Each column header shows status label and visible-card count.
- [x] 5.3.5 Cards show company, title, applied date or "Not applied", date added, location, and type badge.
- [x] 5.3.6 Kanban uses the same filtered application result set as the grid; search/date/type/status filters apply before grouping.

### [x] 5.4 Drag And Drop

- [x] 5.4.1 Add `@dnd-kit` for accessible drag-and-drop; do not hand-roll pointer math.
- [x] 5.4.2 Dragging a card to a different status column updates `applications.status`.
- [x] 5.4.3 Use optimistic UI updates so the card moves immediately.
- [x] 5.4.4 Roll back the card to its prior column and show an error toast if the update fails.
- [x] 5.4.5 Moving a card to its current status is a no-op and does not call the API.
- [x] 5.4.6 Keep keyboard drag support available through the chosen DnD library.

### [x] 5.5 Pagination And Loading Strategy

- [x] 5.5.1 Hide page-number pagination in Kanban view.
- [x] 5.5.2 Fetch enough rows for board use with an explicit Kanban limit, capped by the API maximum.
- [x] 5.5.3 Show a muted hint if filters match more records than the Kanban fetch limit.
- [x] 5.5.4 Keep grid pagination unchanged when switching back to Grid.
- [x] 5.5.5 Do not reset filters when switching between views.

### [x] 5.6 Kanban Responsive Layout

- [x] 5.6.1 Desktop Kanban scrolls horizontally with fixed-width columns.
- [x] 5.6.2 Mobile Kanban uses horizontal lane scrolling and cards sized to avoid page-level horizontal overflow.
- [x] 5.6.3 The Applications rail stacks below the board on narrow screens.
- [x] 5.6.4 Empty board state reuses the existing no-applications and filtered-empty messaging.

### [x] 5.7 Kanban Tests

- [x] 5.7.1 Unit test grouping applications into status columns.
- [x] 5.7.2 Unit test that filters are preserved when toggling `view`.
- [x] 5.7.3 Component or integration test: dropping a card into a new column calls update with the new `status`.
- [x] 5.7.4 Component or integration test: failed status update rolls back optimistic movement.
- [x] 5.7.5 Regression test: Grid header sorting still sends the selected server sort after switching back from Kanban.

## [ ] Phase 6 — Interview History

Track interviews as a history under each application instead of overloading Kanban workflow columns with every interview stage.

### [x] 6.1 Read-Only Application Interview Log

- [x] 6.1.1 Add `GET /api/applications/:id/interviews`.
- [x] 6.1.2 Scope interview lookup to the current user and owned application.
- [x] 6.1.3 Sort interviews by `scheduled_at DESC`.
- [x] 6.1.4 Add a web API function and React Query hook for application interviews.
- [x] 6.1.5 Show interview history in the application modal for existing applications.
- [x] 6.1.6 Cover empty, loading, error, and populated interview log states.

### [x] 6.2 Interview Type Expansion

- [x] 6.2.1 Replace the current broad `technical` interview type with more specific types such as coding, system design, behavioral, recruiter screen, hiring manager, and final.
- [x] 6.2.2 Add any needed migration or enum update for persisted interview type values.
- [x] 6.2.3 Keep old interview types readable during migration.

### [x] 6.3 Interview Create And Edit Flow

- [x] 6.3.1 Add application-scoped create and edit interview UI.
- [x] 6.3.2 Allow multiple interview records per application.
- [x] 6.3.3 Support status, outcome, interviewer names, location link, scheduled time, and notes.
- [x] 6.3.4 Keep compact Kanban interview summaries deferred until a board-level interview summary endpoint is defined.

## [x] Phase 7 — Playbook Tab

Add a primary Playbook tab as a read-only application strategy reference. This pulls the v3 Playbook concept forward while avoiding new database tables or write workflows.

### [x] 7.1 Route And Navigation

- [x] 7.1.1 Add `/playbook` as an authenticated route.
- [x] 7.1.2 Add Playbook to the primary desktop navigation.
- [x] 7.1.3 Add Playbook to the mobile bottom navigation with a compact mobile label.
- [x] 7.1.4 Keep `/interviews` and `/notifications` redirected to Today.

### [x] 7.2 Read-Only Playbook Content

- [x] 7.2.1 Replace the placeholder with a complete reference page.
- [x] 7.2.2 Render the 4-step application process.
- [x] 7.2.3 Render the cover letter guide and explicitly label the personalized “in” as the cover letter differentiator.
- [x] 7.2.4 Render where-to-apply, double-down email, follow-up email, and template guidance.
- [x] 7.2.5 Link template management to the Contacts tab.
- [x] 7.2.6 Render the per-application checklist as a numbered read-only reference with no checkboxes.

### [x] 7.3 Playbook Tests

- [x] 7.3.1 Add a Playbook render test for the core sections.
- [x] 7.3.2 Add a regression assertion that the checklist does not render checkbox inputs.

---

## Appendix A — Query Reference

All queries are scoped by `user_id = :uid`. These are references for implementation; prefer typed query helpers in API code.

### A.1 Stat Cards

```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE created_at >= date_trunc('week', now())) AS this_week
FROM applications
WHERE user_id = :uid;

SELECT count(*) AS phone_screens
FROM interviews
WHERE user_id = :uid
  AND interview_type = 'phone_screen';

SELECT count(*) AS open_tasks,
       count(*) FILTER (WHERE priority = 'high') AS high_pri
FROM tasks
WHERE user_id = :uid
  AND status = 'open';

SELECT count(*) FILTER (
         WHERE scheduled_at >= date_trunc('week', now())
           AND scheduled_at < date_trunc('week', now()) + interval '1 week'
       ) AS this_week,
       count(*) FILTER (WHERE scheduled_at::date = current_date) AS today,
       count(*) FILTER (
         WHERE scheduled_at >= date_trunc('week', now()) + interval '1 week'
           AND scheduled_at < date_trunc('week', now()) + interval '2 week'
       ) AS next_week
FROM interviews
WHERE user_id = :uid
  AND status = 'scheduled';
```

### A.2 Up Next

```sql
SELECT i.*, a.company, a.title
FROM interviews i
JOIN applications a ON a.id = i.application_id
WHERE i.user_id = :uid
  AND a.user_id = :uid
  AND i.status = 'scheduled'
  AND i.scheduled_at >= now()
ORDER BY i.scheduled_at ASC
LIMIT 1;
```

### A.3 Action Items

```sql
SELECT t.*, a.company AS application_company, a.title AS application_title,
       c.first_name, c.last_name
FROM tasks t
LEFT JOIN applications a ON a.id = t.application_id AND a.user_id = :uid
LEFT JOIN contacts c ON c.id = t.contact_id AND c.user_id = :uid
WHERE t.user_id = :uid
  AND t.status = 'open'
ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         t.due_date ASC NULLS LAST
LIMIT 5;
```

### A.4 Need Attention

```sql
SELECT *
FROM applications
WHERE user_id = :uid
  AND status IN ('in_progress', 'applied', 'screening', 'interviewing', 'technical', 'on_site', 'final_round')
ORDER BY updated_at DESC
LIMIT 5;
```

### A.5 Funnel Buckets

```sql
SELECT status, count(*)
FROM applications
WHERE user_id = :uid
GROUP BY status;
```

| Funnel row | Counts these statuses |
| --- | --- |
| Applied | `applied`, `screening`, `interviewing`, `technical`, `on_site`, `final_round`, `offered` |
| Phone screen | `screening`, `interviewing`, `technical`, `on_site`, `final_round`, `offered` |
| Technical | `technical`, `on_site`, `final_round`, `offered` |
| Final / offer | `final_round`, `offered` |

### A.6 Overdue Follow-Ups

```sql
SELECT c.*
FROM contacts c
WHERE c.user_id = :uid
  AND c.outreach_status IN ('applied_msg_sent', 'double_down_sent', 'follow_up_sent')
  AND c.date_of_last_outreach < current_date - interval '7 days'
ORDER BY c.date_of_last_outreach ASC NULLS LAST
LIMIT 5;
```

### A.7 Recent Contacts

```sql
SELECT c.*
FROM contacts c
WHERE c.user_id = :uid
ORDER BY c.date_of_last_outreach DESC NULLS LAST
LIMIT 4;
```

### A.8 Applications Activity Rail

```sql
SELECT e.event_type, e.body, e.occurred_at, a.id AS application_id, a.company, a.title
FROM application_events e
JOIN applications a ON a.id = e.application_id
WHERE e.user_id = :uid
  AND a.user_id = :uid
ORDER BY e.occurred_at DESC
LIMIT 6;
```

---

## Deploy Order

1. Apply `v2_017` UP to dev with `migrations/v2_017_today_indexes.sql`. For live production, use `migrations/v2_017_today_indexes_PROD_ONLY.sql` and run each statement one at a time outside a transaction.
2. Ship the read API routes.
3. Ship the Today tab and Applications UI rebuild.
4. Ship the Applications Grid/Kanban view toggle.
5. Ship the Playbook primary tab.
6. If anything regresses, revert the API/UI deploy. The index migration can remain safely or be rolled back with its DOWN block.

## Rollback

### Schema

Run the DOWN block of `migrations/v2_017_today_indexes.sql`. For live production, use the DOWN statements in `migrations/v2_017_today_indexes_PROD_ONLY.sql` one at a time outside a transaction. Both files drop only indexes created by v2.1 and modify no rows.

### UI And API

Remove `/today`, restore `/` to redirect to `/applications`, remove `api/src/routes/today.ts`, remove the applications activity endpoint, remove the Applications Kanban view toggle, remove the Playbook primary tab, and restore the previous Applications layout. No data is affected.
