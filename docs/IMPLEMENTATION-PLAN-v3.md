# Track My Application v3.0 — Implementation Plan

**Last updated:** April 28, 2026
**Status:** Future — do not begin until v2.0 is fully shipped
**Depends on:** All phases in `IMPLEMENTATION-PLAN.md` complete

> **Checkbox legend**
>
> - `[ ]` — not started
> - `[x]` — complete

---

## Phase 1 — Schema Additions

*All changes are additive `ALTER TABLE` statements. No existing v2.0 columns are modified or removed.*

### 1.1 Migration v3_001 — Email preference columns

File: `migrations/v3_001_email_preferences.sql`

- [ ] 1.1.1 Create `digest_frequency_enum` (`daily`, `every_2_days`, `weekly`, `never`)
- [ ] 1.1.2 Create `notification_email_status_enum` (`sent`, `failed`, `skipped`)
- [ ] 1.1.3 `ALTER TABLE notification_preferences` — add `email_enabled`, `email_address`, `digest_frequency`, `quiet_hours_start`, `quiet_hours_end`, `last_digest_sent_at`
- [ ] 1.1.4 `ALTER TABLE notification_log` — add `email_sent_at`, `email_status`, `email_to`
- [ ] 1.1.5 Write DOWN block: drop added columns and enums in reverse order

### 1.2 Update shared types

- [ ] 1.2.1 Extend `NotificationPreferences` Zod schema in `shared/src/schemas/` with new email fields
- [ ] 1.2.2 Export updated schema from `shared/src/index.ts`

---

## Phase 2 — Email Delivery Infrastructure

### 2.1 Email provider setup

- [ ] 2.1.1 Add Resend SDK to `api/package.json`: `npm install resend`
- [ ] 2.1.2 Create `api/src/lib/email.ts` — `sendEmail(to: string, subject: string, html: string): Promise<void>` wrapper around Resend client
- [ ] 2.1.3 Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.example`
- [ ] 2.1.4 Verify sender domain in Resend dashboard (manual step — document in `migrations/README.md`)

### 2.2 Email templates

- [ ] 2.2.1 Create `api/src/lib/emailTemplates.ts`
- [ ] 2.2.2 `renderDigestEmail(data: DigestEmailData): string` — returns HTML string
- [ ] 2.2.3 Digest template sections: high-priority task count + top 3, upcoming interviews (next 48h), follow-ups due today, unsubscribe link
- [ ] 2.2.4 All links deep-link to the relevant record in the app
- [ ] 2.2.5 Plain-text fallback included alongside HTML

### 2.3 Unsubscribe token utility

- [ ] 2.3.1 Create `api/src/lib/unsubscribeToken.ts` — `generateToken(userId)` and `verifyToken(token)` using HMAC-SHA256 with `UNSUBSCRIBE_SECRET`
- [ ] 2.3.2 Add `UNSUBSCRIBE_SECRET` to `.env.example` (random 32-byte hex)
- [ ] 2.3.3 Unit test: token generated for user A does not verify for user B

---

## Phase 3 — Digest Job

### 3.1 Digest job implementation

- [ ] 3.1.1 Create `api/src/jobs/sendNotificationDigests.ts`
- [ ] 3.1.2 Query all users where `email_enabled = true` AND `digest_frequency != 'never'`
- [ ] 3.1.3 For each user: calculate whether next send time has been reached based on `digest_frequency` and `last_digest_sent_at`
- [ ] 3.1.4 Check quiet hours — skip if current time in user's local timezone falls within `quiet_hours_start`–`quiet_hours_end`
- [ ] 3.1.5 Query qualifying events: open high-priority tasks, interviews in next 48h, follow-ups due today or overdue
- [ ] 3.1.6 Skip send if no qualifying events exist
- [ ] 3.1.7 Call `renderDigestEmail()` and `sendEmail()`
- [ ] 3.1.8 On success: update `last_digest_sent_at`; insert `notification_log` row with `email_status = sent`
- [ ] 3.1.9 On failure: insert `notification_log` row with `email_status = failed`; do not update `last_digest_sent_at`
- [ ] 3.1.10 Schedule via `node-cron`: run every hour (`0 * * * *`)
- [ ] 3.1.11 Register job startup in `api/src/index.ts`

---

## Phase 4 — Unsubscribe Endpoint

- [ ] 4.1 Add `GET /api/notifications/unsubscribe?token=<token>` to `notifications.ts` — no auth required
- [ ] 4.2 Verify token using `unsubscribeToken.verifyToken()`; return 400 if invalid
- [ ] 4.3 Set `email_enabled = false` for the resolved user
- [ ] 4.4 Return a plain HTML confirmation page (no redirect to the app required)

---

## Phase 5 — Email Preferences UI

- [ ] 5.1 Extend `web/src/pages/NotificationsPage.tsx` with an Email Notifications section below the existing in-app toggles
- [ ] 5.2 Email master toggle: `email_enabled` — disables all email controls when off
- [ ] 5.3 Email address field — pre-filled from account email; user can override
- [ ] 5.4 Digest frequency dropdown: Daily, Every 2 days, Weekly, Never
- [ ] 5.5 Quiet hours start and end time pickers
- [ ] 5.6 Save button PUTs all fields (in-app + email) to `PUT /api/notifications/preferences`
- [ ] 5.7 Success/error toast on save

---

## Phase 6 — QA & Launch Verification

- [ ] 6.1 Send a test digest to a real address and verify formatting in Gmail, Apple Mail, and Outlook
- [ ] 6.2 Verify unsubscribe link in the test email correctly disables email and returns confirmation page
- [ ] 6.3 Verify quiet hours suppression: schedule a send during a quiet window and confirm no email is sent
- [ ] 6.4 Verify deduplication: confirm a user receives at most one digest per frequency window even if the job runs multiple times
- [ ] 6.5 Check Resend dashboard for delivery status on test sends
- [ ] 6.6 Confirm `notification_log` rows are written correctly for sent and failed attempts

---

## Rollback

To roll back v3.0 schema changes run the DOWN block of `v3_001_email_preferences.sql`. This drops the added columns and enums. All v2.0 data is unaffected. Remove the digest cron job registration from `api/src/index.ts` before running the rollback to avoid job errors on startup.
