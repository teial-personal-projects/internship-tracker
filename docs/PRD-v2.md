# Track My Application — Product Requirements Document v2.0

**Product:** Track My Application
**Site:** track-my-app.com
**Prepared by:** Teial Dickens
**Date:** April 27, 2026
**Version:** 2.5 — Job Radar added; deferred features moved to v3
**Status:** In Progress

---

## 1. Executive Summary

Track My Application helps job seekers log applications and track statuses across the job search pipeline. Version 2.0 augments the platform with several new feature modules grounded in a proven outreach-driven application methodology — showing that a personalized cover letter, same-day double-down outreach to a specific person at the company, and a structured follow-up process increases application-to-phone-screen conversion from roughly 2% to approximately 10%.

The v2.0 feature set introduces a unified Contacts system (covering both company contacts and external recruiters), an Action Items task queue, an Application Type classification field, a Companies To Watch research list, an Application Event Log, and a manual Job Radar search flow for discovering roles from curated public job-board sources. The Interview Tracker, In-App Notifications, scheduled background jobs, email delivery, and Playbook originally drafted for v2.0 have moved to v3.0. Navigation keeps four primary tabs with secondary items in a menu.

---

## 2. Background & Context

### 2.1 Current product state

Track My Application v1.3.1 provides:

- Job application log with company, title, location, and status fields
- Status categories: In Progress, Not Started, Applied
- Date tracking for when applications were added and submitted
- Links column for job postings
- Cover letter and notes fields per application
- Dashboard and Job Boards views (consolidated into the Applications tab in v2.0)

### 2.2 What v2.0 addresses

The current product treats the application as the end of the workflow. In practice, the application is only the beginning. Four steps must happen after an application is submitted:

| Step | Action | Timing |
| --- | --- | --- |
| 1 | Submit application with personalized cover letter | Day 0 |
| 2 | Log double-down outreach to a named person at the company | Same day as application |
| 3 | Track follow-up outreach if no response | 4–5 business days later |
| 4 | Research company engineering culture for personalized outreach | Before application |

Additionally, many job seekers work with external recruiters who have their own preferred templates, resume formats, and communication preferences. v2.0 brings the entire workflow — company contacts and recruiters — into a unified Contacts system.

---

## 3. Goals

- Surface the complete per-application outreach workflow in a single view
- Track every named contact (company contact or recruiter) in one unified system
- Support recruiter relationship management including notes, preferences, and templates
- Help users create and manage follow-up tasks without sending reminders or notifications
- Give users an action-item queue that reflects the proven 4-step method
- Let users manually refresh watched-company job feeds and review fresh matches in Discover

---

## 4. Navigation & Layout

### 4.1 Navigation structure

The application uses a **four-tab primary bar** with secondary items in a **hamburger/overflow menu**. This replaces the previous two-tier navigation (Dashboard + Job Boards pills + secondary tab row).

Primary tabs (always visible):

| Tab | Contents |
| --- | --- |
| Applications (Apps on mobile) | Pipeline bar, application list, urgent tasks widget |
| Contacts | Unified contact tracker — company contacts and recruiters in one view |
| Discover | Job radar of fresh matching roles from manually refreshed monitored companies |
| Action Items | Task queue driven by the outreach method |

Overflow / hamburger menu (top-right):

| Item | Contents |
| --- | --- |
| Companies To Watch | Research watchlist of companies to apply to in the future |
| Profile | User profile settings |
| Sign out | End session |

### 4.2 Mobile navigation

On viewports below 768px:

- Primary tabs render as a **bottom navigation bar** with icon + label
- Hamburger icon in the top-right header opens a slide-in drawer for Companies To Watch, Profile, and Sign out
- All tab content stacks to single-column
- The tab bar never wraps or collapses — it scrolls horizontally if viewport is too narrow at any breakpoint

### 4.3 General UX rules

- The Applications tab is the default landing view
- Clicking any application row in the Applications tab opens the Contacts tab pre-filtered to that application's detail view
- Empty states on every tab show instructional content with a primary CTA
- The word "Dashboard" is removed from all user-facing UI
- The topbar has a white (`--card`) background with a `1px var(--line)` bottom border; it shows the app brand mark, app name, version badge, and user avatar
- The active tab indicator is a 2px terracotta (`--accent`) bottom border on the tab text — no background fill on active tabs

### 4.4 Visual design & color system

The visual direction is **Terracotta Daylight**: warm cream canvas, deep navy ink, and terracotta primary actions. The system design document defines where canonical design tokens live in code.

#### Color tokens

Token names follow the design token section of [application-tracker-sdd.md](application-tracker-sdd.md). All component code must reference these tokens — no raw hex values in component files.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#FBF5EC` | Page background |
| `--card` | `#FFFFFF` | Card and modal surface |
| `--soft` | `#F3E9D7` | Chip backgrounds, subtle fills |
| `--softer` | `#FAF4E8` | Row hover, input fills |
| `--line` | `#E8DFC9` | Primary borders and dividers |
| `--ink` | `#1B2540` | Primary text (deep navy) |
| `--ink-2` | `#4E5775` | Secondary text |
| `--ink-3` | `#8A93AE` | Muted / placeholder text |
| `--accent` | `#C85A3A` | Terracotta — primary brand |
| `--accent-dark` | `#A8442A` | Accent hover / darker text |
| `--accent-soft` | `#F7D9CD` | Accent pill backgrounds |
| `--sage` | `#6B8F7A` | Success / calm states |
| `--sage-soft` | `#DDE8DF` | Success pill backgrounds |
| `--sun` | `#D9A441` | Attention states |
| `--sun-soft` | `#F5E6C4` | Attention pill backgrounds |
| `--violet` | `#7C6CB0` | Technical / informational |
| `--violet-soft` | `#E0DAF0` | Informational pill backgrounds |
| `--rose` | `#B5394A` | Overdue / error |
| `--rose-soft` | `#F3D5DA` | Error pill backgrounds |

#### Typography

- **Display + body:** `"Mona Sans", "Inter", -apple-system, sans-serif` — load via Google Fonts, weights 400/500/600/700/800
- **Monospace:** `"JetBrains Mono", ui-monospace, monospace` — used for kicker labels, timestamps, stat counts, and keyboard shortcuts
- **Section headings:** 36px / weight 800 / -0.035em tracking / line-height 1.05
- **Body:** 13–14px / weight 400–500 / line-height 1.55
- **Badge / pill:** 11px / weight 600
- **Kicker label:** 10px / weight 600 / uppercase / 0.14em letter-spacing / monospace

#### Elevation & borders

- **Card shadow:** `0 1px 2px rgba(27,37,64,.04), 0 4px 16px rgba(27,37,64,.04)`
- **Modal shadow:** `0 2px 6px rgba(27,37,64,.06), 0 12px 32px rgba(27,37,64,.08)`
- **Border radius:** 8px (inputs, small elements), 12px (medium cards), 16px (page-level cards), 20px (modals), 11px (brand mark)
- **Dividers:** `1px solid var(--line)`

#### Application type tag colors

| Type | Foreground token | Background token |
| --- | --- | --- |
| Cold Strategic | `--violet` | `--violet-soft` |
| Recruiter-Assisted | `#A36410` | `--sun-soft` |
| Referral | `--sage` | `--sage-soft` |
| Not set | `--ink-3` | `--soft` with dashed border |

#### Application stage badge colors

| Stage | Foreground token | Background token |
| --- | --- | --- |
| Applied | `--ink-2` | `--soft` |
| Phone Screen | `--accent-dark` | `--accent-soft` |
| Technical | `--violet` | `--violet-soft` |
| On Site | `--rose` | `--rose-soft` |
| Final Round | `--sage` | `--sage-soft` |
| Offered | `--sage` | `--sage-soft` |
| Rejected | `--rose` | `--rose-soft` |
| Screening | `--violet` | `--violet-soft` |

#### Outreach status tag colors

| Status | Foreground token | Background token |
| --- | --- | --- |
| Applied msg sent | `--sage` | `--sage-soft` |
| Double-down sent | `--accent` | `--accent-soft` |
| Follow-up due | `#A36410` | `--sun-soft` |
| Follow-up missed | `--rose` | `--rose-soft` |
| Replied | `--sage` | `--sage-soft` |
| Not contacted | `--ink-3` | `--soft` |

#### Priority badge colors

| Priority | Foreground token | Background token |
| --- | --- | --- |
| High | `--accent` | `--accent-soft` |
| Medium | `#A36410` | `--sun-soft` |
| Low | `--ink-3` | `--soft` |

#### Company / contact avatars

Every company and contact row shows a 40×40 rounded square (radius 12) with 2-letter initials. The background color is deterministic — derived from the name so the same company always renders the same color. Cycle through: `--sage-soft`, `--accent-soft`, `--sun-soft`, `--violet-soft`, `--soft`.

#### Design rules

- All colors must reference design system tokens — no raw hex values in component code
- Interactive rows shift background to `--softer` on hover; cards lift `translateY(-2px)` and gain `--shadow-md` on hover
- Focus rings use `--accent` at 40% opacity
- Error states use `--rose`; success states use `--sage`; `--accent` is reserved for primary CTAs and brand actions only
- No emoji anywhere in the UI
- Empty states are warm and direct — no exclamation marks

---

## 5. Feature Specifications

### Feature 1: Applications Tab — Consolidated View

The existing Dashboard/Job Boards experience is consolidated into a single Applications tab.

#### 5.1 Layout (top to bottom)

- Pipeline bar: segmented bar showing application count at each stage (Applied, Screening, Technical, On Site, Final Round, Offer).
- Search and filter bar: text search by company name, Status dropdown, Application Type dropdown, Date Range picker (applied date from / to), + Add Application button
- Application list: columnar list showing Date added, Company and role, Status badge, Application Type tag, Checklist progress (e.g. 8/18).
- Server-side pagination at the bottom — default page size 25, with previous/next controls and a page indicator (e.g. "Page 2 of 5")
- Recent contacts widget and Urgent action items widget side by side below the list

#### 5.2 Application Type tag in job list

Every row shows a color-coded Application Type tag:

- Blue — Cold Strategic
- Purple — Recruiter-Assisted
- Green — Referral
- Gray dashed — Not set

Applications with type Not set show a prompt in the Applications tab encouraging the user to set the type.

#### 5.3 Checklist progress column

Shows a fraction (e.g. 8/18) color-coded as follows:

- Green — all steps complete
- Amber — more than half complete
- Red — fewer than 4 complete
- Gray dash — not started or Application Type is Referral

Clicking the fraction navigates directly to that application's checklist panel in the Contacts tab.

---

### Feature 2: Unified Contacts System

Company contacts and external recruiters are managed in a **single Contacts tab** using one underlying data model differentiated by a `contact_type` field.

#### 2.1 Contact types

| Type | Description |
| --- | --- |
| `company_contact` | A person at a target company — hiring manager, engineering lead, technical recruiter, or CTO. Always linked to a specific application. |
| `recruiter` | An external recruiter who operates across multiple applications. Not necessarily tied to a single application. |

#### 2.2 Contact record — shared fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| first_name | Text | Yes | Free text, max 100 |
| last_name | Text | Yes | Free text, max 100 |
| contact_type | Enum | Yes | `company_contact`, `recruiter` |
| title | Text | No | e.g. Engineering Lead, Senior Tech Recruiter |
| email | Text | No | Validated format |
| phone | Text | No | |
| linkedin_url | Text | No | |
| how_found | Dropdown | No | LinkedIn, Company site, Referral, Other |
| notes | Rich text | No | Free-form |
| date_of_last_outreach | Date | Auto | Updated when outreach status changes |
| created_at | Timestamp | Auto | |
| updated_at | Timestamp | Auto | |

#### 2.3 Company contact — additional fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| application_id | FK | Yes | Links to the applications record |
| outreach_status | Dropdown | Yes | Not contacted, Applied msg sent, Double-down sent, Follow-up sent, Replied, No response |

#### 2.4 Recruiter — additional fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| agency | Text | No | e.g. TechTalent Partners, Independent |
| preferred_contact_method | Dropdown | No | Email, LinkedIn, Phone, Text |
| recruiter_status | Dropdown | Yes | Active, Inactive, Follow up needed |

#### 2.5 Contact templates

Any contact (company contact or recruiter) can have one or more named templates attached. Templates are primarily used by recruiters to store their preferred formats, but any contact may have them.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| contact_id | FK | Yes | Parent contact |
| name | Text | Yes | Template label, e.g. "Cover letter format" |
| template_type | Enum | Yes | `email_format`, `resume_version`, `intro_pitch`, `cover_letter`, `other` |
| body | Rich text | No | Template content or instructions |

Templates attached to a contact surface inside the Action Items task view when a task references that contact.

#### 2.6 Interaction log

Every contact has a chronological interaction log. Entries are created manually or auto-generated on outreach status changes.

| Field | Type | Notes |
| --- | --- | --- |
| contact_id | FK | Parent contact |
| purpose | Enum | `application_message`, `double_down`, `follow_up`, `reply_received`, `phone_screen_confirmed`, `initial_contact`, `role_discussion`, `resume_submitted`, `role_update`, `feedback_received`, `note` |
| body | Text | Free-text notes or message summaries |
| occurred_at | Timestamp | Auto-set to now; editable |

#### 2.7 Recruiter → application links

A recruiter contact can be linked to one or more application records via a join table (`application_contacts`). This link surfaces on the application detail view and in the Contacts tab filter. Deleting an application removes the join record but does not delete the recruiter contact.

#### 2.8 Outreach status tags (visual — company contacts only)

| Tag | Color | Meaning |
| --- | --- | --- |
| Applied msg sent | Green | Cover letter submitted with application |
| Double-down sent | Blue | Direct outreach logged same day |
| Follow-up due | Amber | 4–5 business days passed, no response |
| Follow-up missed | Red | Follow-up due date has passed |
| Replied | Bold green | Contact responded |
| Not contacted | Gray | No outreach sent yet |

#### 2.9 Filter and sort

- Filter by: contact_type, outreach_status (company contacts), recruiter_status (recruiters), linked company
- Sort by: contact_type, status, company name, date added, date of last outreach
- Search by contact name or company

#### 2.10 Follow-up task creation

When a company contact's outreach status is set to `Double-down sent`, the system creates a follow-up Task with due date = today + 4 business days, referencing the contact name and company. V2 creates the task only as a record in Action Items; it does not send notifications, emails, or scheduled reminders.

---

### Feature 3: Action Items & Task Queue

#### 3.1 Overview

The Action Items tab gives users a single queue of everything that needs to happen across their entire job search. Tasks are created automatically by the system or added manually. Each task is categorized, prioritized, and optionally linked to an application, contact, or recruiter.

#### 3.2 Task record fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| title | Text | Yes | Short description |
| category | Enum | Yes | `application`, `outreach`, `research`, `interview_prep`, `recruiter`, `other` |
| priority | Enum | Yes | `high`, `medium`, `low` |
| due_date | Date | No | Pre-populated for auto-generated tasks |
| status | Enum | Yes | `open`, `complete`, `skipped` |
| application_id | FK | No | Optional link to application |
| contact_id | FK | No | Optional link to contact |
| notes | Text | No | Additional context |

#### 3.3 Auto-generated tasks (system triggers)

| Trigger | Task generated | Priority | Default due date |
| --- | --- | --- | --- |
| Application status → Applied (Cold Strategic) | Log double-down outreach to [company] contact | High | Same day |
| Contact outreach_status → Double-down sent | Send follow-up to [contact name] at [company] | High | +4 business days |
| Application added (no contact linked) | Find engineering lead at [company] for double-down | Medium | +1 day |
| Application type = Recruiter-Assisted | Optional manual follow-up with recruiter about [company] | Medium | User-selected |
| Application type = Referral | Send thank-you note to referral contact | Medium | Same day |

#### 3.4 Task list view

- Default sort: priority (High first), then due date ascending
- Filter by: category, priority, status, linked company, application type, due date range
- Group by: company, category, due date
- Quick-complete checkbox per row — single click marks complete

#### 3.5 Applications tab widget

The Applications tab surfaces a compact widget showing the top 3 open high-priority tasks with a link to the full Action Items tab.

---

### Feature 4: Application Type

#### 4.1 Overview

Application Type is a field on every application record. It controls which checklist steps are active, which tasks auto-generate, and which Playbook guidance surfaces.

#### 4.2 The three application types

| Type | Definition | Auto-generated tasks |
| --- | --- | --- |
| Cold Strategic | Direct application, no prior connection. Full 4-step outreach applies. | Double-down task (Day 0), follow-up task (Day 4–5), find-contact task if no contact linked |
| Recruiter-Assisted | Application sourced or managed by an external recruiter. | Resume submission task per recruiter template; user may add recruiter follow-up tasks manually |
| Referral | Someone inside the company referred the candidate. Cold outreach not needed. | Thank-you note task to referral contact, post-screen follow-up tasks only |

#### 4.3 Field spec

| Property | Value |
| --- | --- |
| Field name | application_type |
| Data type | Enum |
| Allowed values | `cold_strategic`, `recruiter_assisted`, `referral` |
| Required | No — defaults to null (shown as 'Not set') |
| Editable | Yes — downstream checklist and tasks update on change |

#### 4.4 Checklist behavior by type

| Type | Checklist |
| --- | --- |
| Cold Strategic | All 18 steps active |
| Recruiter-Assisted | Steps 6–12 (contact-finding and double-down) marked N/A; 12 active steps |
| Referral | Steps 9–12 (double-down and contact-finding) marked N/A; 14 active steps |

---

### Feature 8: Companies To Watch

#### 8.1 Overview

Companies To Watch is a lightweight research watchlist for users who want to track promising companies before they are ready to apply. It is especially useful for users who want to build a target list for future recruiting cycles. The feature is accessible from the hamburger/overflow menu — not a primary tab.

#### 8.2 Watchlist entry fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| company_name | Text | Yes | Free text, max 200 |
| industry | Text | No | Free text, max 100 |
| website | Text | No | URL validated |
| notes | Text | No | Research notes — engineering blog links, tech stack, notable team members |
| priority | Enum | No | `high`, `medium`, `low` — reuses `task_priority_enum` |
| target_apply_date | Date | No | Target date or approximate planning date the user intends to apply |
| added | Date | Auto | Date the entry was added |

#### 8.3 List view

- Search by company name
- Filter by: priority and target apply date range
- Sort by: date added, company name, priority, target apply date
- Each row: company name, industry badge, priority dot, target apply date, notes preview (truncated to one line)
- Empty state with instructional text and an Add Company CTA

#### 8.4 Promote to application

A "Start Application" button on each watchlist entry creates a new record in `applications` pre-populated with `company_name` and `industry`, then removes the watchlist entry. The user is navigated to the new application record in the Applications tab.

---

### Feature 9: Application Event Log

#### 9.1 Overview

The Application Event Log is a chronological record of everything that happens to a specific application — messages from the company, requests for additional information, status updates, documents submitted, offers received, and rejections. Unlike the Contact Interaction Log (which tracks outreach to named individuals), the Application Event Log is scoped to the application itself and does not require a named contact.

#### 9.2 Event record fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| application_id | FK | Yes | Links to the applications record |
| user_id | UUID FK | Auto | From auth.users |
| event_type | Enum | Yes | See §9.3 |
| body | Text | No | Free-form notes or detail, max 5000 chars |
| contact_id | FK | No | Optional link to a contact if a specific person was involved |
| occurred_at | Timestamp | Yes | Auto-set to now; user-editable |

#### 9.3 Event types

| Value | Display label | Description |
| --- | --- | --- |
| `status_change` | Status Change | Application moved to a new stage |
| `company_reached_out` | Company Reached Out | Company initiated contact with the candidate |
| `info_requested` | Information Requested | Company asked for additional materials or information |
| `document_submitted` | Document Submitted | Candidate submitted a document (resume, portfolio, work sample) |
| `offer_received` | Offer Received | Verbal or written offer extended |
| `interview_scheduled` | Interview Scheduled | A round was booked |
| `rejection` | Rejection | Rejection received |
| `note` | Note | Free-form log entry (catch-all) |

#### 9.4 Display

The event log appears on the application detail view as a vertical timeline ordered by `occurred_at` descending (most recent at top). Each entry shows the event type label, elapsed time since it occurred (e.g. "2 days ago"), and body text if present. If a `contact_id` is linked, the contact name renders as a secondary line below the event type.

#### 9.5 Adding events

A user can log an event via an inline form directly in the timeline panel: event type dropdown, optional body text field, and an `occurred_at` field that defaults to the current date and time. No modal is required.

---

### Feature 10: Job Radar

#### 10.1 Overview

The Job Radar is a trusted job-board discovery surface without background jobs in v2.0. Discovery starts from public job boards that expose safe searchable APIs, RSS feeds, documented export formats, or equivalent explicit non-scraping integration paths. The system models those sources as curated `radar_sources`, normalizes their postings, filters them to the user's criteria, and surfaces fresh matches in a Discover view that opens the original posting. Direct ATS adapters remain available for company-specific careers refreshes, but they are not the primary discovery strategy. Scheduled polling, notifications, and email alerting for new matches are specified in `PRD-v3.md`.

#### 10.2 Monitored sources

Curated job-board source metadata lives in `radar_sources`. A source is eligible for trusted discovery only when it exposes a safe searchable API, feed, documented export format, or other explicit integration path that does not require broad scraping, anti-bot bypassing, or paid access.

Company-specific Radar settings can still live on Companies To Watch entries for direct ATS refreshes. A watchlist company becomes a direct ATS refresh source when the user supplies its ATS type and board token and enables the radar.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| radar_source_id | Text | Source-discovered postings | Source identifier from `radar_sources` |
| source_tier | Enum | Yes | `curated_board`, `direct_ats`, or `aggregator`; curated boards are the default discovery tier |
| ats_type | Enum | Direct ATS only | `greenhouse`, `lever`, `ashby`, `smartrecruiters`, `pinpoint`, `welcomekit`, `custom` |
| ats_board_token | Text | Direct ATS only | The board identifier from the ATS URL |
| radar_enabled | Boolean | Direct ATS only | Off by default; direct refresh reads only enabled company sources |
| last_refreshed_at | Timestamp | Auto | Updated after each manual direct ATS refresh |

#### 10.3 Discovered postings

Each normalized posting is stored once per curated source or direct ATS source, deduped on the external job id and canonical fingerprint where available.

| Field | Type | Notes |
| --- | --- | --- |
| watchlist_id | FK | Nullable; set only for company-specific direct ATS refreshes |
| radar_source_id | Text | Nullable; set for source-discovered postings |
| company_name | Text | Denormalized for display |
| external_job_id | Text | The upstream job id; unique per source for dedupe |
| title | Text | Role title |
| location | Text | Raw location string from the source |
| remote_status | Text | Parsed remote or LA classification |
| url | Text | Direct link to the posting |
| posted_at | Timestamp | From the source when available |
| first_seen_at | Timestamp | When the radar first saw it; drives the apply-fast goal |
| source_tier | Enum | `curated_board`, `direct_ats`, or `aggregator` |
| validity_status | Enum | `unchecked`, `live`, `closed`, `not_found`, `stale`, or `error` |
| status | Enum | `new`, `seen`, `dismissed`, `promoted`; Radar does not create application records in the trusted job-board flow |

#### 10.4 Matching

Manual search keeps only postings that match the user's criteria. Criteria include target titles, fields or industries, locations, and exclusion terms.

#### 10.5 Discover surface

The Discover tab lists new matched postings grouped by company, newest first, each with a NEW badge, source tier, validity state, the posted and first-seen dates, and a remote tag. Each card opens the original posting and can be dismissed. It does not create Applications records or Companies To Watch records from job-board results. A filter bar narrows by status, company, source tier, validity, and search.

#### 10.6 Direct ATS refreshes

Direct ATS adapters are retained for explicit company-specific refreshes from Companies To Watch. They may improve provenance and validity checks for known target companies, but broad Radar discovery starts from curated public job-board sources that expose safe APIs or feeds.

---

## 6. Product Data and Technical Boundaries

V2 product requirements define what data the product must capture and how users should experience the workflow. Physical table schemas, indexes, enum definitions, route implementation details, RLS policy shape, and background job design live in [application-tracker-sdd.md](application-tracker-sdd.md). V2 does not implement background jobs.

### 6.1 Product data concepts

| Concept | Product responsibility |
| --- | --- |
| Application | Stores company, role, status, application type, dates, links, notes, checklist progress, and source. |
| Contact | Stores company contacts and external recruiters, differentiated by type. |
| Contact interaction | Stores dated outreach, recruiter communication, reply, and note history. |
| Contact template | Stores reusable contact-specific email, resume, cover-letter, and pitch guidance. |
| Application-contact link | Links recruiters to one or more applications without deleting recruiters when applications are deleted. |
| Task | Stores manual and auto-generated action items with category, priority, status, due date, and optional application/contact links. |
| Company watchlist entry | Stores companies a user wants to monitor before applying. |
| Application event | Stores application-scoped timeline entries independent of named contacts. |
| Discovered posting | Stores normalized roles found by Job Radar from curated job-board sources or company-specific direct ATS refreshes. |

### 6.2 Business rules

1. Cold strategic applications create same-day double-down outreach tasks when they move to Applied.
2. Recruiter-assisted applications suppress double-down tasks and let users create recruiter follow-up work manually.
3. Referral applications suppress irrelevant outreach checklist steps and create thank-you note work.
4. Changing an application type recalculates active checklist steps and cancels pending auto-generated tasks that no longer apply.
5. Marking double-down outreach as sent creates a follow-up task due four business days later.
6. V2 does not send notifications, emails, scheduled reminders, or overdue escalations.
7. Deleting an application requires user confirmation and preserves standalone recruiter contacts.

### 6.3 Authentication and ownership expectations

- All V2 user data is scoped to the authenticated user.
- The API never accepts a user ID from client-controlled request data.
- Existing records owned by another user return forbidden responses; nonexistent records return not-found responses.
- Linked entities must belong to the same authenticated user before they can be connected.

### 6.4 API surface expectations

The app exposes authenticated API capabilities for Applications, Contacts, Action Items, Companies To Watch, Application Events, Job Radar, and Profile. Exact route paths, validation schemas, persistence details, and ownership-check implementation live in [application-tracker-sdd.md](application-tracker-sdd.md) and the implementation plan.

---

## 7. Out of Scope for v2.0

- Interview Tracker, In-App Notifications, and Playbook, all moved to v3.0 (originally drafted for v2.0)
- Email integration of any kind (outreach emails, notification digests, follow-up reminders) — planned for v3.0
- Background schedulers or cron jobs, including overdue escalation and scheduled Radar polling — planned for v3.0
- Calendar integration for phone screen scheduling
- AI-generated cover letter drafting
- Resume file storage and version management
- Team or cohort sharing features
- Mobile native app (iOS/Android)
- SMS notifications

---

## 8. Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Auto-task generation creates noise for users not following the 4-step method | Medium | Medium | Allow users to disable auto-task generation per application |
| Contact email field creates expectation of email send functionality | High | Low | Label field as reference only; no mailto links or send-email actions in v2.0 |
| Data model changes require migration of existing application records | High | Low | All new entities are additive; jobs table untouched during rollout |
| Unified contacts model creates confusion about recruiter vs. company contact | Low | Medium | Clear visual differentiation in the UI with contact_type badge |
| Curated board API or feed changes break a source adapter | Medium | Low | Per-source error isolation in manual search; one bad source never aborts another search |

---

## 9. Acceptance Criteria

### Feature 1 — Applications Tab

- [ ] Application list renders records for the authenticated user with server-side pagination (25 per page)
- [ ] Date range filter (date_from / date_to) correctly constrains the list to applications with an applied date within the specified range
- [ ] Application list has no year constraint — all records across all years are returned when no date range is set
- [ ] Application Type tag appears on every row with correct color coding
- [ ] Checklist progress fraction is color-coded and clickable
- [ ] Urgent tasks widget shows top 3 open high-priority tasks and updates within 5 seconds of a task change
- [ ] Pipeline bar correctly counts applications at each status stage

### Feature 2 — Unified Contacts

- [ ] User can add a company contact linked to any existing application
- [ ] User can add a recruiter contact not linked to any specific application
- [ ] Contact type badge (company contact / recruiter) is visible on every row
- [ ] Outreach status tags display with correct colors for company contacts
- [ ] Setting outreach_status to `double_down_sent` auto-creates a follow-up task with due date = today + 4 business days
- [ ] Recruiter contact can be linked to one or more applications via the join table
- [ ] Interaction log entries persist and display in reverse chronological order
- [ ] Templates can be added to any contact; template type is labeled
- [ ] Deleting an application removes linked company contacts but not recruiter contacts
- [ ] Contact list supports filter by contact_type, outreach_status, recruiter_status

### Feature 3 — Action Items

- [ ] Task queue displays all open tasks sorted by priority then due date
- [ ] Auto-generated tasks are created within 5 seconds of the triggering status change
- [ ] Tasks past due date are visually marked as missed; no automatic escalation occurs
- [ ] Task can be marked complete with a single click
- [ ] Completed tasks move to a Done section
- [ ] Task list supports filtering by category, priority, status, linked company

### Feature 4 — Application Type

- [ ] Application Type dropdown appears on every application detail view
- [ ] Color-coded type tag appears in the Applications tab application list
- [ ] Changing type to Recruiter-Assisted suppresses checklist steps 6–12
- [ ] Changing type to Referral suppresses checklist steps 9–12
- [ ] Changing type cancels no-longer-applicable auto-generated tasks

### Feature 9 — Application Event Log

- [ ] Application event timeline is visible on the application detail view
- [ ] Events render in reverse chronological order (most recent first)
- [ ] User can log an event with a type, optional body, and optional occurred_at override
- [ ] occurred_at defaults to now but is user-editable before submission
- [ ] If a contact_id is linked, the contact name is shown on the event entry
- [ ] GET /api/applications/:id/events returns 403 when a user accesses another user's application
- [ ] Events are cascade-deleted when the parent application is deleted

### Navigation

- [ ] Four primary tabs render at all viewport widths
- [ ] Hamburger menu contains Companies To Watch, Profile, Sign out
- [ ] Discover tab renders the job radar as a primary tab
- [ ] On mobile (<768px), primary tabs render as bottom navigation bar
- [ ] Bottom nav never wraps — scrolls horizontally if needed
- [ ] All tab content stacks to single-column on viewports below 600px

### Feature 8 — Companies To Watch

- [ ] Companies To Watch page is accessible from the hamburger menu
- [ ] User can add, edit, and delete watchlist entries
- [ ] List is searchable by company name and filterable by priority and target apply date range
- [ ] "Start Application" button creates a new application pre-populated with company name and industry, removes the watchlist entry, and navigates to the new record
- [ ] Watchlist entries are scoped to the authenticated user (403 on unauthorized access)

### Feature 10 — Job Radar

- [ ] Curated public job-board sources are selected only when they expose safe searchable APIs, feeds, documented exports, or equivalent explicit integration paths
- [ ] Manual search reads trusted `curated_board` sources and writes new matches to discovered_postings
- [ ] Direct ATS adapters remain available for company-specific Companies To Watch refreshes, not primary discovery
- [ ] A repeat manual search inserts no duplicate postings for the same source and external job id
- [ ] The Discover tab lists new matched postings grouped by company with a NEW badge, source tier, validity state, and first-seen date
- [ ] Radar posting cards open the original posting and do not create Applications or Companies To Watch records
- [ ] Dismiss hides a posting and it does not reappear on the next manual refresh
- [ ] Radar data is scoped to the authenticated user (403 on unauthorized access)

---

## 10. Revision History

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0 | April 24, 2026 | Teial Dickens | Initial draft |
| 2.0 | April 27, 2026 | Teial Dickens | Navigation simplified; Contacts and Recruiters unified; Playbook moved to menu; Notifications added; persona removed; schema expanded |
| 2.1 | April 28, 2026 | Teial Dickens | Notifications scoped to in-app only; email delivery moved to v3.0; notification schema simplified |
| 2.2 | April 28, 2026 | Teial Dickens | Removed year constraint from Applications tab; added date range filter and server-side pagination; added Companies To Watch feature |
| 2.3 | April 30, 2026 | Teial Dickens | Renamed "Jobs" tab to "Applications" (abbreviated "Apps" on mobile) throughout |
| 2.4 | May 2, 2026 | Teial Dickens | Added Feature 9: Application Event Log — application-level interaction timeline independent of named contacts; fixed `entry_type` → `purpose` column name in contact_interactions technical spec |
| 2.5 | June 16, 2026 | Teial Dickens | Interview Tracker, In-App Notifications, and Playbook moved to PRD-v3.md; added Job Radar (manual ATS refresh feeding Companies To Watch); Interviews tab replaced with Discover |
