# Track My Application v3.0 — Implementation Plan

**Last updated:** June 16, 2026
**Status:** Future. Begin after v2.0 (descoped) is shipped.
**Depends on:** All phases in `IMPLEMENTATION-PLAN-v2.md` complete.

Checkbox legend:

- `[ ]` not started
- `[x]` complete

> **Scope note (June 2026).** Phases 5 through 7 were moved here intact from the original v2 plan, keeping their original numbers for traceability (Interview Tracker, In-App Notifications, Playbook). The email notification work that originally made up v3 follows as Phases 8 onward. Build in numeric order. Interviews and notifications must land before the email digest, which depends on both.

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

### 5.5 Edit and delete interviews

- [ ] 5.5.1 Add `deleteInterview` to the interviews API client
- [ ] 5.5.2 Add `useDeleteInterview` hook
- [ ] 5.5.3 Extend the Interview modal with edit mode (pre-populate from selected interview)
- [ ] 5.5.4 Add Edit button and trash icon with AlertDialog confirm to each interview row in both the global list and per-application panel
- [ ] 5.5.5 Wire up edit/delete handlers in `InterviewsPage`

---

## Phase 6 — In-App Notifications

*Notifications are written to `notification_log` at the moment triggering events occur. Email delivery of these notifications is handled later in this same plan, in the digest job phase (Phase 10).*

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
- [ ] 6.2.3 Deduplicate: skip insert if an unread notification for the same `(user_id, notification_type, source_id)` already exists
- [ ] 6.2.4 Call `createNotification` from existing trigger points: task auto-generation service, overdue escalation job, interview trigger service
- [ ] 6.2.5 Unit test: `createNotification` skips insert when an unread notification for the same `(user_id, notification_type, source_id)` already exists
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

## Phase 8 — Schema Additions

*All changes are additive `ALTER TABLE` statements. No existing v2.0 columns are modified or removed.*

### 8.1 Migration v3_001 — Email preference columns

File: `migrations/v3_001_email_preferences.sql`

- [ ] 8.1.1 Create `digest_frequency_enum` (`daily`, `every_2_days`, `weekly`, `never`)
- [ ] 8.1.2 Create `notification_email_status_enum` (`sent`, `failed`, `skipped`)
- [ ] 8.1.3 `ALTER TABLE notification_preferences` — add `email_enabled`, `email_address`, `digest_frequency`, `quiet_hours_start`, `quiet_hours_end`, `last_digest_sent_at`
- [ ] 8.1.4 `ALTER TABLE notification_log` — add `email_sent_at`, `email_status`, `email_to`
- [ ] 8.1.5 Write DOWN block: drop added columns and enums in reverse order

### 8.2 Update shared types

- [ ] 8.2.1 Extend `NotificationPreferences` Zod schema in `shared/src/schemas/` with new email fields
- [ ] 8.2.2 Export updated schema from `shared/src/index.ts`

---

## Phase 9 — Email Delivery Infrastructure

### 9.1 Email provider setup

- [ ] 9.1.1 Add Resend SDK to `api/package.json`: `npm install resend`
- [ ] 9.1.2 Create `api/src/lib/email.ts` — `sendEmail(to: string, subject: string, html: string): Promise<void>` wrapper around Resend client
- [ ] 9.1.3 Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.example`
- [ ] 9.1.4 Verify sender domain in Resend dashboard (manual step — document in `migrations/README.md`)

### 9.2 Email templates

- [ ] 9.2.1 Create `api/src/lib/emailTemplates.ts`
- [ ] 9.2.2 `renderDigestEmail(data: DigestEmailData): string` — returns HTML string
- [ ] 9.2.3 Digest template sections: high-priority task count + top 3, upcoming interviews (next 48h), follow-ups due today, unsubscribe link
- [ ] 9.2.4 All links deep-link to the relevant record in the app
- [ ] 9.2.5 Plain-text fallback included alongside HTML

### 9.3 Unsubscribe token utility

- [ ] 9.3.1 Create `api/src/lib/unsubscribeToken.ts` — `generateToken(userId)` and `verifyToken(token)` using HMAC-SHA256 with `UNSUBSCRIBE_SECRET`
- [ ] 9.3.2 Add `UNSUBSCRIBE_SECRET` to `.env.example` (random 32-byte hex)
- [ ] 9.3.3 Unit test: token generated for user A does not verify for user B

---

## Phase 10 — Digest Job

### 10.1 Digest job implementation

- [ ] 10.1.0 Add `node-cron` dependency to `api/package.json` for V3 background jobs
- [ ] 10.1.1 Create `api/src/jobs/sendNotificationDigests.ts`
- [ ] 10.1.2 Query all users where `email_enabled = true` AND `digest_frequency != 'never'`
- [ ] 10.1.3 For each user: calculate whether next send time has been reached based on `digest_frequency` and `last_digest_sent_at`
- [ ] 10.1.4 Check quiet hours — skip if current time in user's local timezone falls within `quiet_hours_start`–`quiet_hours_end`
- [ ] 10.1.5 Query qualifying events: open high-priority tasks, interviews in next 48h, follow-ups due today or overdue
- [ ] 10.1.6 Skip send if no qualifying events exist
- [ ] 10.1.7 Call `renderDigestEmail()` and `sendEmail()`
- [ ] 10.1.8 On success: update `last_digest_sent_at`; insert `notification_log` row with `email_status = sent`
- [ ] 10.1.9 On failure: insert `notification_log` row with `email_status = failed`; do not update `last_digest_sent_at`
- [ ] 10.1.10 Schedule via `node-cron`: run every hour (`0 * * * *`)
- [ ] 10.1.11 Register job startup in `api/src/index.ts`

---

## Phase 11 — Unsubscribe Endpoint

- [ ] 11.1 Add `GET /api/notifications/unsubscribe?token=<token>` to `notifications.ts` — no auth required
- [ ] 11.2 Verify token using `unsubscribeToken.verifyToken()`; return 400 if invalid
- [ ] 11.3 Set `email_enabled = false` for the resolved user
- [ ] 11.4 Return a plain HTML confirmation page (no redirect to the app required)

---

## Phase 12 — Email Preferences UI

- [ ] 12.1 Extend `web/src/pages/NotificationsPage.tsx` with an Email Notifications section below the existing in-app toggles
- [ ] 12.2 Email master toggle: `email_enabled` — disables all email controls when off
- [ ] 12.3 Email address field — pre-filled from account email; user can override
- [ ] 12.4 Digest frequency dropdown: Daily, Every 2 days, Weekly, Never
- [ ] 12.5 Quiet hours start and end time pickers
- [ ] 12.6 Save button PUTs all fields (in-app + email) to `PUT /api/notifications/preferences`
- [ ] 12.7 Success/error toast on save

---

## Phase 13 — QA & Launch Verification

- [ ] 13.1 Send a test digest to a real address and verify formatting in Gmail, Apple Mail, and Outlook
- [ ] 13.2 Verify unsubscribe link in the test email correctly disables email and returns confirmation page
- [ ] 13.3 Verify quiet hours suppression: schedule a send during a quiet window and confirm no email is sent
- [ ] 13.4 Verify deduplication: confirm a user receives at most one digest per frequency window even if the job runs multiple times
- [ ] 13.5 Check Resend dashboard for delivery status on test sends
- [ ] 13.6 Confirm `notification_log` rows are written correctly for sent and failed attempts

---

## Phase 14. Scheduled Job Radar Polling and Alerts

*Builds on the trusted-source Job Radar search flow and the In-App Notifications in Phase 6 of this plan, and feeds the digest from Phase 10. Build after all three are in place.*

- [ ] 14.1 Add `new_matching_role` to `notification_type_enum` (additive migration)
- [ ] 14.2 Create `api/src/jobs/pollRadarSources.ts` using the trusted-source search service
- [ ] 14.3 Query active `radar_sources` rows where `source_tier = 'curated_board'` and trusted discovery is enabled
- [ ] 14.4 Search each curated board through its safe API, feed, documented export, or explicit integration path, isolate errors per source, and update source refresh metadata
- [ ] 14.5 Keep direct ATS adapters available only for enabled company-specific watchlist refreshes, not as the primary polling target
- [ ] 14.6 Schedule via `node-cron` every 30 minutes, with a staggered start to stay polite to boards
- [ ] 14.7 Guard startup with `ENABLE_BACKGROUND_JOBS`; jobs do not run in tests unless explicitly invoked
- [ ] 14.8 After inserting a new matching posting, call `createNotification(userId, 'new_matching_role', postingId, message)`
- [ ] 14.9 Include new matching roles in the v3 email digest qualifying events
- [ ] 14.10 Confirm a new matching role produces exactly one notification and respects the dedupe rule

---

## Phase 15. Scheduled Overdue Task Handling

*Builds on V2 Action Items and V3 In-App Notifications. V2 only visually marks past-due tasks; this phase adds background escalation and notification behavior.*

- [ ] 15.1 Create `api/src/jobs/escalateOverdueTasks.ts`
- [ ] 15.2 Query all open tasks where `due_date < today`
- [ ] 15.3 Set `priority = high` and append `(Overdue)` to title if not already present
- [ ] 15.4 Create one `overdue_task` notification per task, subject to notification preferences and dedupe rules
- [ ] 15.5 Schedule via `node-cron` daily at 00:05 UTC
- [ ] 15.6 Guard startup with `ENABLE_BACKGROUND_JOBS`; jobs do not run in tests unless explicitly invoked
- [ ] 15.7 Unit test: past-due tasks have `priority` set to `high` and `(Overdue)` appended once
- [ ] 15.8 Unit test: overdue notification is created once and not duplicated while unread

---

## Rollback

Roll back in reverse phase order. The interview, notification, playbook, scheduled Radar polling, and overdue task phases have their own migration DOWN blocks where applicable; run those first if rolling the whole release back. Then roll back the email schema:
To roll back v3.0 schema changes run the DOWN block of `v3_001_email_preferences.sql`. This drops the added columns and enums. All v2.0 data is unaffected. Remove digest, Radar polling, and overdue cron registrations from `api/src/index.ts` before running the rollback to avoid job errors on startup.
