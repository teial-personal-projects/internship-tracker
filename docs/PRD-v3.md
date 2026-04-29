# Track My Application — Product Requirements Document v3.0

**Product:** track-my-app.com
**Prepared by:** Teial Dickens
**Date:** April 28, 2026
**Version:** 3.0 — Draft
**Status:** Future — not yet scheduled for development

---

## 1. Overview

v3.0 builds on the in-app notification foundation shipped in v2.0 and adds email delivery of notifications. The primary driver is user retention — users who are not actively logged in should still receive timely reminders about follow-ups, overdue tasks, and upcoming interviews.

Email delivery was explicitly excluded from v2.0 due to the cost of provisioning and maintaining a transactional email domain. v3.0 assumes that cost has been evaluated and approved.

---

## 2. Prerequisites

v3.0 depends on the following v2.0 deliverables being complete and stable:

- `notification_preferences` table — preference toggles already exist; v3.0 adds email-specific fields
- `notification_log` table — in-app notification records; v3.0 adds email delivery tracking columns
- In-app notification bell and preferences UI — email settings are added to the existing page
- All task and interview trigger points already call `notificationService.createNotification()`

---

## 3. Goals

- Deliver timely email digests to users who are not actively using the app
- Give users full control over email frequency and quiet hours
- Maintain a reliable unsubscribe path in every email

---

## 4. Feature Specifications

### Feature 1: Email Notification Delivery

#### 1.1 Overview

Users who opt in receive a scheduled email digest summarising overdue tasks, upcoming interviews, and follow-ups due. The digest is not a real-time alert — it batches qualifying events and sends them on the user's chosen cadence.

#### 1.2 Email notification preferences (additions to v2.0 schema)

The following fields are added to the existing `notification_preferences` table:

| Field | Type | Notes |
| --- | --- | --- |
| email_enabled | BOOLEAN | NOT NULL, default false — master switch for email; independent of in-app toggle |
| email_address | TEXT | nullable, max 254 — defaults to account email; user can override |
| digest_frequency | ENUM | `daily`, `every_2_days`, `weekly`, `never` |
| quiet_hours_start | TIME | nullable — user's local time |
| quiet_hours_end | TIME | nullable — user's local time |
| last_digest_sent_at | TIMESTAMPTZ | nullable — used to determine next send time |

#### 1.3 Email digest format

The digest email contains:

- Count of open high-priority tasks with top 3 listed by due date
- Upcoming interviews in the next 48 hours (type, company, date/time)
- Follow-ups overdue or due today (contact name, company)
- A "View all" link to the app with deep links where possible

#### 1.4 Delivery provider

Use a transactional email provider. Resend is the recommended starting point due to its simple API and generous free tier. The sender domain must be verified before any emails can be sent.

Required environment variables:

```env
RESEND_API_KEY=
EMAIL_FROM=notifications@track-my-app.com
UNSUBSCRIBE_SECRET=<random 32-byte hex>
```

#### 1.5 Unsubscribe

Every email must include a one-click unsubscribe link. The link contains a signed token (HMAC of `user_id` using `UNSUBSCRIBE_SECRET`). Following the link sets `email_enabled = false` without requiring the user to log in.

#### 1.6 Notification log additions

The following columns are added to `notification_log` to track email delivery attempts alongside in-app notifications:

| Column | Type | Notes |
| --- | --- | --- |
| email_sent_at | TIMESTAMPTZ | nullable — set when an email is sent for this notification |
| email_status | ENUM | `sent`, `failed`, `skipped`, nullable |
| email_to | TEXT | nullable — address the email was sent to |

#### 1.7 Digest job

A cron job runs hourly and processes all users where `email_enabled = true` and `digest_frequency != 'never'`. For each eligible user:

1. Calculate whether enough time has passed since `last_digest_sent_at` based on `digest_frequency`
2. Check quiet hours — skip if the user's current local time falls within `quiet_hours_start`–`quiet_hours_end`
3. Query qualifying events (overdue tasks, upcoming interviews, follow-ups due)
4. Skip send if no qualifying events
5. Render and send the digest email
6. Update `last_digest_sent_at` and insert `notification_log` rows with `email_status = sent`

---

## 5. Technical Requirements

### 5.1 Schema changes (additive only)

All changes are `ALTER TABLE` additions to existing v2.0 tables. No existing columns are modified.

```sql
ALTER TABLE notification_preferences
  ADD COLUMN email_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN email_address TEXT,
  ADD COLUMN digest_frequency digest_frequency_enum,
  ADD COLUMN quiet_hours_start TIME,
  ADD COLUMN quiet_hours_end TIME,
  ADD COLUMN last_digest_sent_at TIMESTAMPTZ;

ALTER TABLE notification_log
  ADD COLUMN email_sent_at TIMESTAMPTZ,
  ADD COLUMN email_status notification_email_status_enum,
  ADD COLUMN email_to TEXT;
```

New enums:

```sql
CREATE TYPE digest_frequency_enum AS ENUM (
  'daily', 'every_2_days', 'weekly', 'never'
);

CREATE TYPE notification_email_status_enum AS ENUM (
  'sent', 'failed', 'skipped'
);
```

### 5.2 API additions

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | /api/notifications/unsubscribe | None | Verify signed token; set `email_enabled = false` |

The existing `PUT /api/notifications/preferences` endpoint is updated to accept the new email-specific fields.

---

## 6. Out of Scope for v3.0

- Real-time push notifications (browser or mobile)
- Per-notification email sending (digest only)
- Email template customisation by the user
- SMS notifications

---

## 7. Revision History

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 3.0 | April 28, 2026 | Teial Dickens | Initial draft — email notification delivery, deferred from v2.0 |
