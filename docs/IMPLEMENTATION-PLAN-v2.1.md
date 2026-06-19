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

The intended look is warmer, denser, and more executive-dashboard-like than v2.0: cream page background, compact top navigation, large greeting, flat stat cards, structured panels, and quiet right rails. The screenshot’s Recruitments, Interviews, and Playbook nav items are visual direction only. They remain deferred to v3 unless separately pulled forward.

## Non-Goals

- No new write workflows for interviews.
- No Recruitments tab.
- No Playbook tab.
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

### [ ] 2.1 Route And Default Landing

- [ ] 2.1.1 Add `Today` as the first primary tab in `web/src/components/NavBar.tsx`.
- [ ] 2.1.2 Add `/today` route in `web/src/App.tsx`.
- [ ] 2.1.3 Change `/` and the authenticated default redirect from `/applications` to `/today`.
- [ ] 2.1.4 Keep `/applications` directly reachable.
- [ ] 2.1.5 Keep `/interviews`, `/playbook`, and `/notifications` redirected; do not add screenshot-only tabs in v2.1.

### [ ] 2.2 Page Scaffold

- [ ] 2.2.1 Create `web/src/pages/TodayPage.tsx`.
- [ ] 2.2.2 Fetch `GET /api/today` once on load using the existing React Query pattern.
- [ ] 2.2.3 Use a two-column layout: main content and a right rail; stack the rail below the main column under 768px.
- [ ] 2.2.4 Show one page-level loading state and one page-level error state.
- [ ] 2.2.5 Preserve mobile bottom navigation spacing with `mobile-safe-bottom`.

### [ ] 2.3 Greeting And Summary

- [ ] 2.3.1 Render "Good morning, {first name}." and accent the first name with the app accent color.
- [ ] 2.3.2 Build the summary from interviews today, open tasks, and overdue contacts.
- [ ] 2.3.3 Omit zero-value clauses from the summary.
- [ ] 2.3.4 Empty summary: "You're all caught up. Nothing needs you today."

### [ ] 2.4 Flat Stat Cards

- [ ] 2.4.1 Create `web/src/components/today/StatCards.tsx`.
- [ ] 2.4.2 Render four flat cards: Applications, Phone screens, Open tasks, and Interviews this week.
- [ ] 2.4.3 Cards use a white surface, 1px `--line` border, muted label, and large number.
- [ ] 2.4.4 Do not add corner color blocks, triangles, or decorative blobs.
- [ ] 2.4.5 Show `0` and a muted hint for empty card values.

### [ ] 2.5 Up Next

- [ ] 2.5.1 Create `web/src/components/today/UpNextCard.tsx`.
- [ ] 2.5.2 Source the single next scheduled interview from `interviews`.
- [ ] 2.5.3 Show time, interview type, company, title, interviewer names, Join button when `location_link` exists, and Prep notes when `notes` exists.
- [ ] 2.5.4 Empty state: show a slim "No interviews scheduled." line.

### [ ] 2.6 Action Items

- [ ] 2.6.1 Create `web/src/components/today/ActionItemsPanel.tsx`.
- [ ] 2.6.2 Source open `tasks`, sorted by priority then due date.
- [ ] 2.6.3 Each row shows a checkbox, task title, linked company/contact context, due label, and priority pill.
- [ ] 2.6.4 Checking a task calls the existing task PATCH with `status = 'complete'` and removes it from the list.
- [ ] 2.6.5 Header count is total open tasks, not just the rendered limit.
- [ ] 2.6.6 Empty state: "No open action items."

### [ ] 2.7 Need Attention

- [ ] 2.7.1 Create `web/src/components/today/NeedAttentionPanel.tsx`.
- [ ] 2.7.2 Source active applications ordered by `updated_at DESC`.
- [ ] 2.7.3 Include applications in `in_progress`, `applied`, `screening`, `interviewing`, `technical`, `on_site`, and `final_round`.
- [ ] 2.7.4 Add a no-type nudge only if the schema or data allows `application_type IS NULL`; current v2.0 defaults it to `cold_strategic`, so this may be zero forever.
- [ ] 2.7.5 Empty state: "Nothing in active stages right now."

### [ ] 2.8 Funnel

- [ ] 2.8.1 Create `web/src/components/today/FunnelPanel.tsx`.
- [ ] 2.8.2 Bucket status counts into Applied, Phone screen, Technical, and Final/offer.
- [ ] 2.8.3 Use Applied as the denominator and guard divide-by-zero.
- [ ] 2.8.4 Empty state: "No applications in this cycle yet."

### [ ] 2.9 Overdue Follow-Ups

- [ ] 2.9.1 Create `web/src/components/today/OverdueFollowupsPanel.tsx`.
- [ ] 2.9.2 Use contacts with `outreach_status IN ('applied_msg_sent', 'double_down_sent', 'follow_up_sent')`.
- [ ] 2.9.3 Treat contacts as overdue when `date_of_last_outreach` is older than 7 days.
- [ ] 2.9.4 Put the 7-day threshold in one constant.
- [ ] 2.9.5 Use thin monochrome initials circles, not colored squares.
- [ ] 2.9.6 Empty state: "You're current on follow-ups."
- [ ] 2.9.7 Leave a short code comment noting exact recency can later use `MAX(contact_interactions.occurred_at)`.

### [ ] 2.10 Recent Contacts

- [ ] 2.10.1 Create `web/src/components/today/RecentContactsPanel.tsx`.
- [ ] 2.10.2 Order contacts by `date_of_last_outreach DESC NULLS LAST`.
- [ ] 2.10.3 Each row shows neutral initials, name, title, company or agency, and outreach/recruiter status.
- [ ] 2.10.4 Empty state: "No contacts yet."

### [ ] 2.11 Today Tests

- [ ] 2.11.1 Summary line omits zero-valued clauses.
- [ ] 2.11.2 Funnel rows are monotonically non-increasing for any status distribution.
- [ ] 2.11.3 Overdue follow-ups exclude contacts inside the threshold and closed statuses.
- [ ] 2.11.4 Up-next returns the soonest future scheduled interview and excludes past interviews.

---

## [ ] Phase 3 — Applications Tab Rebuild

Replace the wide table/card split with a compact list plus a right rail. Preserve existing filters, actions, pagination, and write paths.

### [ ] 3.1 Compact List Rows

- [ ] 3.1.1 Rebuild the Applications list row at roughly 48px height.
- [ ] 3.1.2 Row content: thin status-colored left bar, company as primary text, title as muted secondary text.
- [ ] 3.1.3 Sub-line: status badge, `applied_date` or "Not applied", and location separated by middots.
- [ ] 3.1.4 Status bar color comes from `STATUS_COLORS`; avoid extra row color.
- [ ] 3.1.5 Keep Edit and delete controls without changing existing write paths.

### [ ] 3.2 Remove Colored Initial Squares

- [ ] 3.2.1 Remove colored company/contact initial squares from Applications list surfaces.
- [ ] 3.2.2 If a marker still helps in the rail, use a neutral outline avatar variant.

### [ ] 3.3 Right Rail

- [ ] 3.3.1 Add `web/src/components/applications/ApplicationsRail.tsx`.
- [ ] 3.3.2 Rail stacks below the list under 768px.
- [ ] 3.3.3 Mini pipeline card shows status label, color dot, and count from shared pipeline counts.
- [ ] 3.3.4 Clicking a pipeline row sets the `status` filter; clicking the active row clears it.
- [ ] 3.3.5 Recent activity card uses `GET /api/applications/activity`.
- [ ] 3.3.6 Activity lines show company, event label, optional body snippet, and relative time.
- [ ] 3.3.7 Keep an "applications have no type set" nudge only if the count is greater than zero.

### [ ] 3.4 Preserve Filters, Search, And Pagination

- [ ] 3.4.1 Existing search, date range, type filter, status filter, page, and limit query params continue to drive `GET /api/applications`.
- [ ] 3.4.2 Status filtering is also wired to rail clicks.
- [ ] 3.4.3 Pagination still shows the correct item range and reflects `?page=N`.
- [ ] 3.4.4 No year dropdown comes back.

### [ ] 3.5 Empty States

- [ ] 3.5.1 No applications: list area shows onboarding prompt with Add button; rail shows zeros.
- [ ] 3.5.2 Filtered empty state: show "No applications match these filters" and a Clear filters action.
- [ ] 3.5.3 Pipeline statuses with zero count still render muted.

### [ ] 3.6 Applications Tests

- [ ] 3.6.1 Clicking a pipeline row sets the status filter; clicking it again clears it.
- [ ] 3.6.2 Activity rail shows only events for owned applications.
- [ ] 3.6.3 Compact row renders "Not applied" for null `applied_date`.

---

## [ ] Phase 4 — QA And Cross-Browser

- [ ] 4.1 Today and Applications render correctly at 390x844 and 360x780; rails stack below content.
- [ ] 4.2 No horizontal page overflow at 320px on either tab.
- [ ] 4.3 Test Chrome, Firefox, and Safari desktop.
- [ ] 4.4 All-zero account shows empty states and no null text.
- [ ] 4.5 `/today` is the post-login default and `/applications` still loads directly.
- [ ] 4.6 No colored initial squares remain in Today or rebuilt Applications.
- [ ] 4.7 Stat cards render flat with no corner accents.
- [ ] 4.8 Re-run Applications regression checks: pagination math, inclusive date range, multi-year results with no date filter.

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
4. If anything regresses, revert the API/UI deploy. The index migration can remain safely or be rolled back with its DOWN block.

## Rollback

### Schema

Run the DOWN block of `migrations/v2_017_today_indexes.sql`. For live production, use the DOWN statements in `migrations/v2_017_today_indexes_PROD_ONLY.sql` one at a time outside a transaction. Both files drop only indexes created by v2.1 and modify no rows.

### UI And API

Remove `/today`, restore `/` to redirect to `/applications`, remove `api/src/routes/today.ts`, remove the applications activity endpoint, and restore the previous Applications layout. No data is affected.
