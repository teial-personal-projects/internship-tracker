# Track My Application — Product Requirements Document v3.0

**Product:** Track My Application
**Site:** track-my-app.com
**Prepared by:** Teial Dickens
**Date:** June 16, 2026
**Version:** 3.0 — Draft
**Status:** Future (begins after v2.0 ships)

---

## 1. Executive Summary

Version 3.0 carries forward the features deferred from the v2.0 draft: the Interview Tracker, In-App Notifications, Playbook, and Job Discovery. It also adds the email delivery layer on top of in-app notifications (digests, quiet hours, and unsubscribe). Job Discovery includes the future Discover surface, provider or direct-source search, discovered postings, and optional alerts that turn a freshly discovered matching role into an in-app notification and a digest line.

Feature numbers restart at one for this document. The Interview Tracker, In-App Notifications, and Playbook specs are reproduced from the v2.0 draft unchanged except for renumbering.

---

## 2. Scope & Dependencies

This release depends on v2.0 being complete, since the email layer builds on the In-App Notifications schema and job discovery alerts build on In-App Notifications. The v3.0 feature set is:

- Interview Tracker (carried from the v2.0 draft)
- In-App Notifications (carried from the v2.0 draft)
- Playbook (carried from the v2.0 draft)
- Email Delivery and Digests (new)
- Job Discovery and Radar Alerts (carried from v2.0 and expanded)

---

## 3. Feature Specifications

### Feature 1: Interview Tracker

#### 1.1 Overview

The Interview Tracker provides a global view of all scheduled interviews across every application, plus a per-application interview panel inside the Contacts tab.

#### 1.2 Interview record fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| interview_type | Enum | Yes | `phone_screen`, `technical`, `on_site`, `final_round`, `screening` |
| application_id | FK | Yes | Links to application record |
| scheduled_at | DateTime | Yes | Date and time |
| interviewer_names | Text | No | Free text |
| location_link | Text | No | Video URL, address, or phone number |
| notes | Rich text | No | Prep notes, topics expected |
| status | Enum | Yes | `scheduled`, `completed`, `cancelled` |
| outcome | Enum | No | `passed`, `rejected`, `withdrawn`, `no_decision_yet`. Available only when status = `completed` |

#### 1.3 Interview types and stage colors

| Type | Badge color |
| --- | --- |
| Screening | Purple |
| Phone Screen | Orange |
| Technical | Blue |
| On Site | Red |
| Final Round | Green |

#### 1.4 Global Interviews tab

- Default sort: scheduled_at ascending, section break between Upcoming and Completed
- Filter bar: All, Phone Screen, Technical, On Site, Final Round (with count badges)
- Each row: completion checkbox, type badge, company logo/initials, company name, role title, Application Type tag, countdown (e.g. "Today", "in 3 days", "11 days ago")
- Completed rows: muted opacity, moved to Completed section
- Clicking a row expands an inline detail panel
- Prep reminder callout at top when any interview is within 24 hours

#### 1.5 Per-application interview panel

Each application card in the Contacts tab shows an Interviews sub-panel with:

- Compact row per interview: type badge, date/time, interviewer name, countdown
- "Not yet scheduled" placeholder for future stages
- \+ Add button to schedule a new interview without leaving the tab

#### 1.6 Checklist auto-advance on interview scheduling

| Interview scheduled | Checklist auto-check | Tasks auto-created |
| --- | --- | --- |
| Any type | Step 15 (move-on reminder) marked N/A | None |
| Phone Screen | Steps 13–14 (follow-up steps) if not done | Prep task (1 day before), thank-you note (same day) |
| Technical | None | Review technical topics task (2 days before) |
| On Site / Final Round | Steps 16–17 pre-populated | Review all prior notes task (1 day before) |

---

### Feature 2: In-App Notifications

#### 2.1 Overview

Users can configure which events trigger in-app alerts. Alerts appear inside the app — no emails are sent in v2.0. Email delivery is planned for v3.0.

#### 2.2 Notification preferences

Accessible from the hamburger menu → Notification settings. Each setting is stored per user in `notification_preferences`.

| Setting | Type | Options |
| --- | --- | --- |
| Notifications enabled | Toggle | On / Off (master switch) |
| Notify on overdue tasks | Toggle | On / Off |
| Notify on upcoming interviews (within 24h) | Toggle | On / Off |
| Notify when follow-up is due | Toggle | On / Off |
| Notify when recruiter hasn't responded in 5 days | Toggle | On / Off |

#### 2.3 In-app notification panel

A notification bell icon in the app header shows an unread badge count. Clicking it opens a dropdown panel listing unread notifications, each showing:

- Notification type icon
- Short description (e.g. "Follow-up overdue — Acme Corp")
- Relative timestamp (e.g. "2 hours ago")
- Link that navigates directly to the relevant application, task, or interview

Notifications are marked read when the panel is opened. A "Mark all read" action clears the badge.

#### 2.4 Notification log

Every in-app notification is stored in `notification_log`. A notification for a given source_id is not duplicated if one already exists unread for that entity.

#### 2.5 Notification generation

In-app notifications are created server-side by the same triggers that create tasks (see §6.4 business logic). Each trigger inserts a row into `notification_log` for the affected user. No background job or cron is required — notifications are written at the moment the triggering event occurs.

---

### Feature 3: Playbook

#### 3.1 Overview

The Playbook is the strategic application method reference guide. It is accessed from the hamburger/overflow menu, not a primary tab, to keep the main navigation focused.

#### 3.2 Content: The 4-step application process

Every application should follow these four steps in order. Skipping any step significantly reduces your conversion rate.

| Step | What to do | When |
| --- | --- | --- |
| 1 | Apply on the company website or LinkedIn with a strong resume and a personalized **cover letter** (application message). Use any saved cover letter templates from your Contacts if applicable. | Day 0 — when you submit |
| 2 | Send a double-down email directly to a named person at the company (eng lead, CTO, or recruiter depending on company size) | Same day as application — do not wait |
| 3 | Send a follow-up email as a reply to your double-down thread | 4–5 business days after applying, if no response |
| 4 | If you land a phone screen, send a thank-you note to every person you spoke with | Within 24 hours of the call |

#### 3.3 Writing the cover letter (your application message)

The cover letter should be 120–150 words maximum. It is not a formal letter — think of it as a direct, confident message to a colleague. It has four parts:

#### Part 1: Engineering credibility signal (include 2×)

Show your value as an engineer. Reference something specific and real:

- Open source project: name it, describe the problem in 5 words, note the dev community response
- Talk or publication: name the talk and the venue. Italicize the title.
- Mature technical opinion: reference a specific challenge (scaling, architecture) and your take on it
- Prestigious school or prior company: put this in your signature rather than the body

#### Part 2: Your personalized "in" — the cover letter differentiator (include 1×)

This must be something you could only know if you genuinely researched the company — not from the job description. The "in" is what makes your cover letter a cover letter rather than a generic email.

| Research method | What to look for | Example |
| --- | --- | --- |
| Engineering blog | A specific post by a named engineer | "I loved [Name]'s post on [topic]" |
| Engineering lead's LinkedIn | Prior company, a talk, or post about current work | "Saw [Name]'s post about the team's shift to [tech]" |
| Tech stack research | Unusual or interesting stack choices via Wappalyzer/StackShare | "Noticed the team's move to [tech]" |
| Team member's current role | Project blurbs in their LinkedIn current role | "[Name]'s work on [project] caught my eye" |

#### Part 3: Call to action (optional but recommended)

Suggest specific availability. One sentence only.

#### Part 4: Style rules

| Do | Avoid |
| --- | --- |
| Keep under 150 words | Formal cover letter structure |
| Use abbreviations: dev, AWS, eng | Spelling out every proper noun |
| Use dashes and parentheses | Dense punctuation |
| Sign off with "All best" or "Cheers" | "Sincerely" or "Best regards" |
| "Hi there" or "Hi [Name]" | "To Whom It May Concern" |

#### 3.4 Using templates

Templates stored in your Contacts (under a company contact or recruiter record) can be reused directly from the Playbook or from the Action Items task view. When a task references a contact who has templates, a "Use template" shortcut surfaces in the task detail panel. Templates can be of type: Cover letter, Email format, Resume version, Intro pitch, or Other.

#### 3.5 Sending the double-down email

Sent the same day you apply. Short note forwarding your cover letter to a specific person at the company.

#### Who to send it to

| Company size | Target |
| --- | --- |
| < 20 people | CEO |
| 20–200 | CTO or engineering lead |
| 200–2000 | Engineering manager or lead for the relevant team |
| Large / conglomerate | An engineer on the team — informational interview first |
| Any size, if stuck | A technical recruiter at the company on LinkedIn |

#### How to find the email address

- Hunter.io — paste the company domain
- Apollo.io — requires a Google or corporate email
- RocketReach — useful fallback
- Pattern matching from any known address
- LinkedIn InMail as a fallback

**Double-down structure:** Under 4 sentences. Reference the role title. State you applied, say you wanted to make sure it reached them, then paste your full cover letter below.

#### 3.6 The follow-up email

Send 4–5 business days after the double-down if no reply. Reply to the same thread.

> Hi [Name] — did you get a chance to read this? Let me know if you did. All good either way.
> — [Your name] | [LinkedIn] | [GitHub]

#### 3.7 The per-application checklist

Every application record has its own independent 18-step checklist. Checklist state is stored as a JSON blob on the application record and is scoped to that application.

**Checklist data model:** JSON blob of 18 boolean flags keyed by step identifier stored on the `applications` table in `checklist_state`.

---

### Feature 4: Email Delivery & Digests

#### 4.1 Overview

Email delivery sends the in-app notifications from Feature 2 out as email digests on a schedule the user controls. Nothing is emailed in v2.0; this feature adds the delivery layer.

#### 4.2 Digest preferences

Stored per user, extending `notification_preferences`.

| Setting | Type | Options |
| --- | --- | --- |
| Email enabled | Toggle | On / Off (master switch for email) |
| Email address | Text | Pre-filled from account; user can override |
| Digest frequency | Dropdown | Daily, Every 2 days, Weekly, Never |
| Quiet hours | Time range | Start and end; no email sent inside the window |

#### 4.3 Digest content

Each digest gathers qualifying events since the last send: open high-priority tasks, interviews in the next 48 hours, follow-ups due today or overdue, and new matching roles from Job Discovery (Feature 5). A digest with no qualifying events is not sent. Every link deep-links to the relevant record.

#### 4.4 Unsubscribe

Every email carries a one-click unsubscribe link backed by a signed token. Following it sets email enabled to off and shows a plain confirmation page, with no login required.

---

### Feature 5: Job Discovery and Radar Alerts

#### 5.1 Overview

Job Discovery is a V3 feature. It introduces the future Discover surface, source configuration, manual search, optional scheduled polling, and active alerting. New matches can raise an in-app notification and, when email is enabled, appear in the next digest.

#### 5.2 Behavior

The initial implementation should avoid paid job-search APIs and broad scraping. It can start with user-configured direct ATS sources for known companies, then add free, documented, non-scraping public sources only when they are explicitly selected. Manual search should exist before scheduled polling. When a search or poll inserts a new matching posting, it creates a notification of type `new_matching_role` referencing the posting, subject to the user's notification preferences. The same match becomes a line item in the email digest from Feature 4. Each new match produces at most one notification and respects the existing dedupe rule.

---

### Feature 6: Scheduled Overdue Handling

#### 6.1 Overview

V2 visually marks past-due tasks but does not run scheduled escalation. V3 adds background overdue handling so late tasks can generate in-app notifications, appear in email digests, and optionally escalate priority.

#### 6.2 Behavior

A scheduled job checks open tasks whose due date has passed. It marks the task as overdue for display, escalates priority when appropriate, and creates at most one unread overdue-task notification per task.

---

## 4. Technical Requirements

### 4.1 Data model (carried from v2.0 draft)

#### New table: `interviews`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | → `auth.users(id)` |
| application_id | UUID FK | → `applications(id)` ON DELETE CASCADE |
| interview_type | ENUM | `phone_screen`, `technical`, `on_site`, `final_round`, `screening` |
| scheduled_at | TIMESTAMPTZ | NOT NULL |
| interviewer_names | TEXT | nullable, max 500 |
| location_link | TEXT | nullable, max 2048 |
| notes | TEXT | nullable, max 5000 |
| status | ENUM | `scheduled`, `completed`, `cancelled` |
| outcome | ENUM | `passed`, `rejected`, `withdrawn`, `no_decision_yet`, nullable |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

#### New table: `notification_preferences`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | → `auth.users(id)` UNIQUE |
| enabled | BOOLEAN | NOT NULL, default true |
| notify_overdue_tasks | BOOLEAN | NOT NULL, default true |
| notify_upcoming_interviews | BOOLEAN | NOT NULL, default true |
| notify_follow_up_due | BOOLEAN | NOT NULL, default true |
| notify_recruiter_no_response | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

#### New table: `notification_log`

Stores each in-app notification. A notification remains until the user reads it; `read_at` is null for unread notifications.

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | → `auth.users(id)` |
| notification_type | ENUM | `overdue_task`, `upcoming_interview`, `follow_up_due`, `recruiter_no_response` |
| source_id | UUID | nullable — ID of the task, interview, or contact referenced |
| message | TEXT | NOT NULL — short human-readable description |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| read_at | TIMESTAMPTZ | nullable — null means unread |

### 4.2 Email delivery schema additions

These columns extend the carried tables when email ships.

`notification_preferences` gains: `email_enabled` (boolean, default false), `email_address` (text), `digest_frequency` (`digest_frequency_enum`), `quiet_hours_start` (time, nullable), `quiet_hours_end` (time, nullable), `last_digest_sent_at` (timestamptz, nullable).

`notification_log` gains: `email_sent_at` (timestamptz, nullable), `email_status` (`notification_email_status_enum`, nullable), `email_to` (text, nullable).

### 4.3 Enums

```sql
CREATE TYPE interview_type_enum AS ENUM (
  'phone_screen', 'technical', 'on_site', 'final_round', 'screening'
);

CREATE TYPE interview_status_enum AS ENUM (
  'scheduled', 'completed', 'cancelled'
);

CREATE TYPE interview_outcome_enum AS ENUM (
  'passed', 'rejected', 'withdrawn', 'no_decision_yet'
);

CREATE TYPE notification_type_enum AS ENUM (
  'overdue_task', 'upcoming_interview',
  'follow_up_due', 'recruiter_no_response', 'new_matching_role'
);

CREATE TYPE digest_frequency_enum AS ENUM (
  'daily', 'every_2_days', 'weekly', 'never'
);

CREATE TYPE notification_email_status_enum AS ENUM (
  'sent', 'failed', 'skipped'
);
```

*Note: `notification_type_enum` adds `new_matching_role` to the four values from the v2.0 draft, for Job Discovery alerts.*

### 4.4 Indexes

```sql
-- interviews
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON interviews(status);

-- notification_preferences
CREATE UNIQUE INDEX idx_notification_prefs_user_id ON notification_preferences(user_id);

-- notification_log
CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at DESC);
CREATE INDEX idx_notification_log_source_id ON notification_log(source_id);
```

### 4.5 API endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | /api/interviews | requireAuth | List all interviews; ?type, ?status, ?application_id filters |
| POST | /api/interviews | requireAuth | Create an interview; triggers checklist advance and task creation |
| GET | /api/interviews/:id | requireAuth + ownership | Get a single interview |
| PATCH | /api/interviews/:id | requireAuth + ownership | Update interview fields, status, or outcome |
| DELETE | /api/interviews/:id | requireAuth + ownership | Delete an interview |
| GET | /api/notifications | requireAuth | List in-app notifications for req.user.id; supports ?unread_only filter |
| PATCH | /api/notifications/read | requireAuth | Mark all notifications read for req.user.id |
| PATCH | /api/notifications/:id/read | requireAuth + ownership | Mark a single notification read |
| GET | /api/notifications/preferences | requireAuth | Get notification preferences for req.user.id |
| PUT | /api/notifications/preferences | requireAuth | Create or update notification preferences |
| GET | /api/notifications/unsubscribe | none (signed token) | Disable email for the token's user and show a confirmation page |

Job Discovery alerts do not add a separate notification route; the poller calls the same notification-creation path used by the other triggers.

---

## 5. Acceptance Criteria

### Feature 1 — Interview Tracker

- [ ] Global Interviews tab shows all interview records sorted by scheduled_at ascending
- [ ] Filter bar correctly filters by interview type with count badges
- [ ] Scheduling a Phone Screen auto-creates prep task and thank-you task
- [ ] Scheduling any interview auto-checks Step 15 of that application's checklist
- [ ] Prep reminder callout appears when any interview is within 24 hours
- [ ] Interview routes return 403 when a user accesses another user's record

### Feature 2 — Notifications

- [ ] Notification bell icon appears in the app header with an unread badge count
- [ ] Clicking the bell opens a dropdown panel listing unread notifications
- [ ] Each notification shows type icon, description, timestamp, and a navigation link
- [ ] Opening the panel marks all notifications as read and clears the badge
- [ ] Notification preferences page is accessible from the hamburger menu
- [ ] Master on/off toggle prevents all in-app notifications when off
- [ ] Individual toggles correctly suppress notification creation for each event type
- [ ] `notification_log` records every generated in-app notification

### Feature 3 — Playbook

- [ ] Playbook is accessible from the hamburger menu
- [ ] Playbook content mentions cover letter templates and links to Contacts
- [ ] Step 2's "in" is clearly labeled as the cover letter differentiator
- [ ] Playbook is read-only (no checkboxes) — reference only

### Feature 4 — Email Delivery & Digests

- [ ] Email master toggle, address, digest frequency, and quiet hours save and reload correctly
- [ ] A digest is sent only when qualifying events exist and only outside quiet hours
- [ ] At most one digest is sent per frequency window even if the job runs repeatedly
- [ ] The unsubscribe link disables email and shows a confirmation page without login
- [ ] `notification_log` records sent and failed email attempts

### Feature 5 — Job Discovery and Radar Alerts

- [ ] Job Discovery is exposed in V3 navigation, not V2 navigation
- [ ] Manual search can discover matching postings without scheduled polling
- [ ] No paid provider integration is required for the initial V3 implementation
- [ ] A new matching posting raises exactly one `new_matching_role` notification, subject to preferences
- [ ] New matching roles appear in the next email digest when email is enabled
- [ ] The dedupe rule prevents duplicate alerts for the same posting

---

## 6. Revision History

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 3.0 | June 16, 2026 | Teial Dickens | Initial v3 PRD. Interview Tracker, In-App Notifications, and Playbook carried from the v2.0 draft; Email Delivery and Job Radar Alerts added. |
| 3.1 | June 24, 2026 | Teial Dickens | Moved Job Discovery from V2 into V3 and made paid provider integration optional/out of initial scope. |
