# Track My Application — Product Requirements Document v2.0

**Product:** track-my-app.com
**Prepared by:** Teial Dickens
**Date:** April 27, 2026
**Version:** 2.0 — Revised Draft
**Status:** In Progress

---

## 1. Executive Summary

Track My Application helps job seekers log applications and track statuses across the job search pipeline. Version 2.0 augments the platform with five new feature modules grounded in a proven outreach-driven application methodology — showing that a personalized cover letter, a same-day double-down email to a specific person at the company, and a structured follow-up process increases application-to-phone-screen conversion from roughly 2% to approximately 10%.

The v2.0 feature set introduces a unified Contacts system (covering both company contacts and external recruiters), an Interview Tracker, an Action Items task queue, an Application Type classification field, a Playbook reference guide, and an In-App Notifications system. Navigation is simplified to four primary tabs with secondary items accessible via a menu.

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
| 2 | Send double-down email to a named person at the company | Same day as application |
| 3 | Send follow-up email if no response | 4–5 business days later |
| 4 | Research company engineering culture for personalized outreach | Before application |

Additionally, many job seekers work with external recruiters who have their own preferred templates, resume formats, and communication preferences. v2.0 brings the entire workflow — company contacts and recruiters — into a unified Contacts system.

---

## 3. Goals

- Surface the complete per-application outreach workflow in a single view
- Track every named contact (company contact or recruiter) in one unified system
- Support recruiter relationship management including notes, preferences, and templates
- Automate follow-up reminders based on application date
- Give users an action-item queue that reflects the proven 4-step method
- Surface in-app alerts for overdue tasks, upcoming interviews, and follow-ups due

---

## 4. Navigation & Layout

### 4.1 Navigation structure

The application uses a **four-tab primary bar** with secondary items in a **hamburger/overflow menu**. This replaces the previous two-tier navigation (Dashboard + Job Boards pills + secondary tab row).

Primary tabs (always visible):

| Tab | Contents |
| --- | --- |
| Applications (Apps on mobile) | Pipeline bar, application list, urgent tasks widget |
| Contacts | Unified contact tracker — company contacts and recruiters in one view |
| Interviews | Global interview tracker across all applications |
| Action Items | Task queue driven by the outreach method |

Overflow / hamburger menu (top-right):

| Item | Contents |
| --- | --- |
| Playbook | Strategic application method reference guide |
| Companies To Watch | Research watchlist of companies to apply to in the future |
| Notifications | In-app notification preferences |
| Profile | User profile settings |
| Sign out | End session |

### 4.2 Mobile navigation

On viewports below 768px:

- Primary tabs render as a **bottom navigation bar** with icon + label
- Hamburger icon in the top-right header opens a slide-in drawer for Playbook, Companies To Watch, Notification settings, Profile, and Sign out
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

The canonical design reference is `docs/DESIGN_SYSTEM.md` (direction: **Terracotta Daylight** — warm cream canvas, deep navy ink, terracotta accent). Values in this section summarise intent; the design system document is the authoritative source for exact token values, type scale details, and component specs.

#### Color tokens

Token names follow `docs/DESIGN_SYSTEM.md §2`. All component code must reference these tokens — no raw hex values in component files.

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
| Follow-up overdue | `--rose` | `--rose-soft` |
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
- No emoji anywhere in the UI (per `docs/DESIGN_SYSTEM.md §6`)
- Empty states are warm and direct — no exclamation marks

---

## 5. Feature Specifications

### Feature 1: Applications Tab — Consolidated View

The existing Dashboard/Job Boards experience is consolidated into a single Applications tab.

#### 5.1 Layout (top to bottom)

- Pipeline bar: segmented bar showing application count at each stage (Applied, Screening, Technical, On Site, Final Round, Offer). "Interview today" badge links to the Interviews tab.
- Search and filter bar: text search by company name, Status dropdown, Application Type dropdown, Date Range picker (applied date from / to), + Add Application button
- Application list: columnar list showing Date added, Company and role, Status badge, Application Type tag, Checklist progress (e.g. 8/18). Rows with active interviews are highlighted.
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
| Double-down sent | Blue | Direct outreach email sent same day |
| Follow-up due | Amber | 4–5 business days passed, no response |
| Follow-up overdue | Red | Follow-up deadline passed |
| Replied | Bold green | Contact responded |
| Not contacted | Gray | No outreach sent yet |

#### 2.9 Filter and sort

- Filter by: contact_type, outreach_status (company contacts), recruiter_status (recruiters), linked company
- Sort by: contact_type, status, company name, date added, date of last outreach
- Search by contact name or company

#### 2.10 Auto-generated follow-up reminders

When a company contact's outreach status is set to `Double-down sent`, the system auto-creates a follow-up Task with due date = today + 4 business days, referencing the contact name and company.

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
| Application status → Applied (Cold Strategic) | Send double-down email to [company] contact | High | Same day |
| Contact outreach_status → Double-down sent | Send follow-up to [contact name] at [company] | High | +4 business days |
| Phone Screen interview scheduled | Prepare 3–4 PS/TC stories for [company] screen | High | 1 day before screen |
| Phone Screen interview scheduled | Send thank-you note to [interviewer] | Medium | Same day as interview |
| Technical interview scheduled | Review expected technical topics | Medium | 2 days before |
| On Site or Final Round scheduled | Review all prior interview notes | High | 1 day before |
| Application added (no contact linked) | Find engineering lead at [company] for double-down | Medium | +1 day |
| Follow-up task due date passes (still Open) | Priority escalates to High; title appends "(Overdue)" | High | Immediate |
| Application type = Recruiter-Assisted, no recruiter update in 5 days | Follow up with recruiter about [company] | High | +5 days |
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
| Recruiter-Assisted | Application sourced or managed by an external recruiter. | Resume submission task per recruiter template, follow-up to recruiter task if no update after 5 days |
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

### Feature 5: Interview Tracker

#### 5.1 Overview

The Interview Tracker provides a global view of all scheduled interviews across every application, plus a per-application interview panel inside the Contacts tab.

#### 5.2 Interview record fields

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

#### 5.3 Interview types and stage colors

| Type | Badge color |
| --- | --- |
| Screening | Purple |
| Phone Screen | Orange |
| Technical | Blue |
| On Site | Red |
| Final Round | Green |

#### 5.4 Global Interviews tab

- Default sort: scheduled_at ascending, section break between Upcoming and Completed
- Filter bar: All, Phone Screen, Technical, On Site, Final Round (with count badges)
- Each row: completion checkbox, type badge, company logo/initials, company name, role title, Application Type tag, countdown (e.g. "Today", "in 3 days", "11 days ago")
- Completed rows: muted opacity, moved to Completed section
- Clicking a row expands an inline detail panel
- Prep reminder callout at top when any interview is within 24 hours

#### 5.5 Per-application interview panel

Each application card in the Contacts tab shows an Interviews sub-panel with:

- Compact row per interview: type badge, date/time, interviewer name, countdown
- "Not yet scheduled" placeholder for future stages
- \+ Add button to schedule a new interview without leaving the tab

#### 5.6 Checklist auto-advance on interview scheduling

| Interview scheduled | Checklist auto-check | Tasks auto-created |
| --- | --- | --- |
| Any type | Step 15 (move-on reminder) marked N/A | None |
| Phone Screen | Steps 13–14 (follow-up steps) if not done | Prep task (1 day before), thank-you note (same day) |
| Technical | None | Review technical topics task (2 days before) |
| On Site / Final Round | Steps 16–17 pre-populated | Review all prior notes task (1 day before) |

---

### Feature 6: In-App Notifications

#### 6.1 Overview

Users can configure which events trigger in-app alerts. Alerts appear inside the app — no emails are sent in v2.0. Email delivery is planned for v3.0.

#### 6.2 Notification preferences

Accessible from the hamburger menu → Notification settings. Each setting is stored per user in `notification_preferences`.

| Setting | Type | Options |
| --- | --- | --- |
| Notifications enabled | Toggle | On / Off (master switch) |
| Notify on overdue tasks | Toggle | On / Off |
| Notify on upcoming interviews (within 24h) | Toggle | On / Off |
| Notify when follow-up is due | Toggle | On / Off |
| Notify when recruiter hasn't responded in 5 days | Toggle | On / Off |

#### 6.3 In-app notification panel

A notification bell icon in the app header shows an unread badge count. Clicking it opens a dropdown panel listing unread notifications, each showing:

- Notification type icon
- Short description (e.g. "Follow-up overdue — Acme Corp")
- Relative timestamp (e.g. "2 hours ago")
- Link that navigates directly to the relevant application, task, or interview

Notifications are marked read when the panel is opened. A "Mark all read" action clears the badge.

#### 6.4 Notification log

Every in-app notification is stored in `notification_log`. A notification for a given source_id is not duplicated if one already exists unread for that entity.

#### 6.5 Notification generation

In-app notifications are created server-side by the same triggers that create tasks (see §6.4 business logic). Each trigger inserts a row into `notification_log` for the affected user. No background job or cron is required — notifications are written at the moment the triggering event occurs.

---

### Feature 7: Playbook

#### 7.1 Overview

The Playbook is the strategic application method reference guide. It is accessed from the hamburger/overflow menu, not a primary tab, to keep the main navigation focused.

#### 7.2 Content: The 4-step application process

Every application should follow these four steps in order. Skipping any step significantly reduces your conversion rate.

| Step | What to do | When |
| --- | --- | --- |
| 1 | Apply on the company website or LinkedIn with a strong resume and a personalized **cover letter** (application message). Use any saved cover letter templates from your Contacts if applicable. | Day 0 — when you submit |
| 2 | Send a double-down email directly to a named person at the company (eng lead, CTO, or recruiter depending on company size) | Same day as application — do not wait |
| 3 | Send a follow-up email as a reply to your double-down thread | 4–5 business days after applying, if no response |
| 4 | If you land a phone screen, send a thank-you note to every person you spoke with | Within 24 hours of the call |

#### 7.3 Writing the cover letter (your application message)

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

#### 7.4 Using templates

Templates stored in your Contacts (under a company contact or recruiter record) can be reused directly from the Playbook or from the Action Items task view. When a task references a contact who has templates, a "Use template" shortcut surfaces in the task detail panel. Templates can be of type: Cover letter, Email format, Resume version, Intro pitch, or Other.

#### 7.5 Sending the double-down email

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

#### 7.6 The follow-up email

Send 4–5 business days after the double-down if no reply. Reply to the same thread.

> Hi [Name] — did you get a chance to read this? Let me know if you did. All good either way.
> — [Your name] | [LinkedIn] | [GitHub]

#### 7.7 The per-application checklist

Every application record has its own independent 18-step checklist. Checklist state is stored as a JSON blob on the application record and is scoped to that application.

**Checklist data model:** JSON blob of 18 boolean flags keyed by step identifier stored on the `applications` table in `checklist_state`.

---

### Feature 8: Companies To Watch

#### 8.1 Overview

Companies To Watch is a lightweight research watchlist for users who want to track promising companies before they are ready to apply. It is especially useful for college students in their first or second year who want to build a target list for future job or internship cycles. The feature is accessible from the hamburger/overflow menu — not a primary tab.

#### 8.2 Watchlist entry fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| company_name | Text | Yes | Free text, max 200 |
| industry | Text | No | Free text, max 100 |
| website | Text | No | URL validated |
| notes | Text | No | Research notes — engineering blog links, tech stack, notable team members |
| priority | Enum | No | `high`, `medium`, `low` — reuses `task_priority_enum` |
| target_apply_year | Integer | No | Four-digit year the user intends to apply, e.g. 2027 |
| added | Date | Auto | Date the entry was added |

#### 8.3 List view

- Search by company name
- Filter by: priority, target apply year
- Sort by: date added, company name, priority, target apply year
- Each row: company name, industry badge, priority dot, target apply year, notes preview (truncated to one line)
- Empty state with instructional text and an Add Company CTA

#### 8.4 Promote to application

A "Start Application" button on each watchlist entry creates a new record in `applications` pre-populated with `company_name` and `industry`, then removes the watchlist entry. The user is navigated to the new application record in the Applications tab.

---

## 6. Technical Requirements

### 6.1 Data model

#### New table: `applications`

The `applications` table is the v2.0 replacement for the existing `jobs` table. The `jobs` table is left in place; data is bulk-migrated into `applications` during rollout. All new feature code targets `applications`.

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | `gen_random_uuid()` |
| user_id | UUID FK | → `auth.users(id)` |
| company | TEXT | NOT NULL, max 200 |
| title | TEXT | NOT NULL, max 200 |
| industry | TEXT | nullable, max 100 |
| location | TEXT | nullable, max 200 |
| job_link | TEXT | nullable, URL validated |
| app_link | TEXT | nullable, URL validated |
| status | ENUM | `application_status_enum` |
| application_type | ENUM | `cold_strategic`, `recruiter_assisted`, `referral`, nullable |
| checklist_state | JSONB | 18 boolean flags; default `{}` |
| cover_letter | TEXT | nullable, max 5000 |
| notes | TEXT | nullable, max 5000 |
| pay | TEXT | nullable |
| applied_date | DATE | nullable |
| deadline | DATE | nullable |
| added | DATE | NOT NULL, default today |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

#### New table: `contacts`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | → `auth.users(id)` |
| contact_type | ENUM | `company_contact`, `recruiter` NOT NULL |
| application_id | UUID FK | → `applications(id)`, nullable (required for company_contact; null for recruiter) |
| first_name | TEXT | NOT NULL, max 100 |
| last_name | TEXT | NOT NULL, max 100 |
| title | TEXT | nullable, max 200 |
| email | TEXT | nullable, max 254, format validated |
| phone | TEXT | nullable, max 30 |
| linkedin_url | TEXT | nullable, URL validated |
| agency | TEXT | nullable, max 200 (recruiters only) |
| preferred_contact_method | ENUM | `email`, `linkedin`, `phone`, `text`, nullable |
| how_found | ENUM | `linkedin`, `company_site`, `referral`, `other`, nullable |
| outreach_status | ENUM | `not_contacted`, `applied_msg_sent`, `double_down_sent`, `follow_up_sent`, `replied`, `no_response`, nullable (company contacts only) |
| recruiter_status | ENUM | `active`, `inactive`, `follow_up_needed`, nullable (recruiters only) |
| notes | TEXT | nullable, max 5000 |
| date_of_last_outreach | DATE | nullable, auto-set on status change |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

#### New table: `contact_interactions`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| contact_id | UUID FK | → `contacts(id)` ON DELETE CASCADE |
| user_id | UUID FK | → `auth.users(id)` |
| entry_type | ENUM | `application_message`, `double_down`, `follow_up`, `reply_received`, `phone_screen_confirmed`, `initial_contact`, `role_discussion`, `resume_submitted`, `role_update`, `feedback_received`, `note` |
| body | TEXT | nullable, max 5000 |
| occurred_at | TIMESTAMPTZ | NOT NULL, default now() |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |

#### New table: `contact_templates`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| contact_id | UUID FK | → `contacts(id)` ON DELETE CASCADE |
| user_id | UUID FK | → `auth.users(id)` |
| name | TEXT | NOT NULL, max 200 |
| template_type | ENUM | `email_format`, `resume_version`, `intro_pitch`, `cover_letter`, `other` |
| body | TEXT | nullable, max 10000 |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

#### New table: `application_contacts` (join table)

Links recruiter-type contacts to applications (many-to-many).

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| application_id | UUID FK | → `applications(id)` ON DELETE CASCADE |
| contact_id | UUID FK | → `contacts(id)` ON DELETE CASCADE |
| user_id | UUID FK | → `auth.users(id)` |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |

UNIQUE constraint on `(application_id, contact_id)`.

#### New table: `tasks`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | → `auth.users(id)` |
| title | TEXT | NOT NULL, max 500 |
| category | ENUM | `application`, `outreach`, `research`, `interview_prep`, `recruiter`, `other` |
| priority | ENUM | `high`, `medium`, `low` |
| status | ENUM | `open`, `complete`, `skipped` |
| due_date | DATE | nullable |
| application_id | UUID FK | → `applications(id)`, nullable, ON DELETE SET NULL |
| contact_id | UUID FK | → `contacts(id)`, nullable, ON DELETE SET NULL |
| notes | TEXT | nullable, max 2000 |
| is_auto_generated | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

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

#### New table: `company_watchlist`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | `gen_random_uuid()` |
| user_id | UUID FK | → `auth.users(id)` |
| company_name | TEXT | NOT NULL, max 200 |
| industry | TEXT | nullable, max 100 |
| website | TEXT | nullable, URL validated |
| notes | TEXT | nullable, max 5000 |
| priority | task_priority_enum | nullable — reuses existing enum |
| target_apply_year | SMALLINT | nullable — four-digit year, e.g. 2027 |
| added | DATE | NOT NULL, default today |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### 6.2 Indexes

```sql
-- applications
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_application_type ON applications(application_type);
CREATE INDEX idx_applications_added ON applications(added DESC);

-- contacts
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX idx_contacts_application_id ON contacts(application_id);
CREATE INDEX idx_contacts_outreach_status ON contacts(outreach_status);

-- contact_interactions
CREATE INDEX idx_contact_interactions_contact_id ON contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_occurred_at ON contact_interactions(occurred_at DESC);

-- contact_templates
CREATE INDEX idx_contact_templates_contact_id ON contact_templates(contact_id);

-- application_contacts
CREATE INDEX idx_application_contacts_application_id ON application_contacts(application_id);
CREATE INDEX idx_application_contacts_contact_id ON application_contacts(contact_id);

-- tasks
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_application_id ON tasks(application_id);
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id);

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

-- company_watchlist
CREATE INDEX idx_company_watchlist_user_id ON company_watchlist(user_id);
CREATE INDEX idx_company_watchlist_added ON company_watchlist(added DESC);
CREATE INDEX idx_company_watchlist_priority ON company_watchlist(priority);
```

### 6.3 Enums

```sql
CREATE TYPE application_status_enum AS ENUM (
  'not_started', 'in_progress', 'applied', 'screening', 'interviewing',
  'technical', 'on_site', 'final_round', 'offered', 'rejected',
  'withdrawn', 'archive'
);

CREATE TYPE application_type_enum AS ENUM (
  'cold_strategic', 'recruiter_assisted', 'referral'
);

CREATE TYPE contact_type_enum AS ENUM (
  'company_contact', 'recruiter'
);

CREATE TYPE outreach_status_enum AS ENUM (
  'not_contacted', 'applied_msg_sent', 'double_down_sent',
  'follow_up_sent', 'replied', 'no_response'
);

CREATE TYPE recruiter_status_enum AS ENUM (
  'active', 'inactive', 'follow_up_needed'
);

CREATE TYPE interview_type_enum AS ENUM (
  'phone_screen', 'technical', 'on_site', 'final_round', 'screening'
);

CREATE TYPE interview_status_enum AS ENUM (
  'scheduled', 'completed', 'cancelled'
);

CREATE TYPE interview_outcome_enum AS ENUM (
  'passed', 'rejected', 'withdrawn', 'no_decision_yet'
);

CREATE TYPE task_category_enum AS ENUM (
  'application', 'outreach', 'research', 'interview_prep', 'recruiter', 'other'
);

CREATE TYPE task_priority_enum AS ENUM ('high', 'medium', 'low');

CREATE TYPE task_status_enum AS ENUM ('open', 'complete', 'skipped');

CREATE TYPE contact_interaction_type_enum AS ENUM (
  'application_message', 'double_down', 'follow_up', 'reply_received',
  'phone_screen_confirmed', 'initial_contact', 'role_discussion',
  'resume_submitted', 'role_update', 'feedback_received', 'note'
);

CREATE TYPE contact_template_type_enum AS ENUM (
  'email_format', 'resume_version', 'intro_pitch', 'cover_letter', 'other'
);

CREATE TYPE preferred_contact_method_enum AS ENUM (
  'email', 'linkedin', 'phone', 'text'
);

CREATE TYPE how_found_enum AS ENUM (
  'linkedin', 'company_site', 'referral', 'other'
);

CREATE TYPE notification_type_enum AS ENUM (
  'overdue_task', 'upcoming_interview',
  'follow_up_due', 'recruiter_no_response'
);
```

### 6.4 Business logic requirements

1. When `applications.status` changes to `applied` AND `application_type = cold_strategic`, auto-create a Task (category: `outreach`, priority: `high`, due: today) for double-down outreach.
2. When `application_type = recruiter_assisted`, suppress double-down task auto-generation. Auto-create a recruiter follow-up task if no interaction logged within 5 days.
3. When `application_type = referral`, suppress checklist steps 9–12 and auto-create a thank-you note task.
4. When `application_type` is changed on an existing application, recalculate active checklist steps and cancel any pending auto-generated tasks that no longer apply.
5. When `contacts.outreach_status` changes to `double_down_sent`, auto-create a follow-up Task with `due_date = today + 4 business days`.
6. A nightly job scans all open Tasks past `due_date` and escalates `priority` to `high`, appending `(Overdue)` to the title if not already present.
7. Deleting an application prompts the user before cascade-deleting linked contacts (company_contact type), interactions, tasks, and checklist state. Recruiter contacts are not deleted — only the `application_contacts` join record is removed.
8. When an Interview record is inserted, auto-advance the application's `checklist_state` and auto-create relevant prep tasks (see Feature 5, section 5.6).
9. When any task-generating trigger fires (status changes, overdue escalation, interview scheduling), also insert a row into `notification_log` for the affected user if the relevant preference toggle is enabled.

### 6.5 Authentication & user scoping

All new routes follow the `requireAuth` middleware pattern used by existing routes. Every endpoint is protected. User ID is sourced exclusively from `req.user.id` — never from URL parameters, query strings, or request body.

#### Ownership check pattern (all record-level routes)

1. Fetch the record by ID with no user filter
2. If record does not exist → 404
3. If `record.user_id !== req.user.id` → 403 (never 404)
4. Proceed with the operation

#### Cross-entity ownership

- `contact_interactions` — owned via `contact.user_id`
- `contact_templates` — owned via `contact.user_id`
- `application_contacts` — owned via both `application.user_id` and `contact.user_id` (must match)
- `tasks` — own `user_id` field; linked application/contact must also belong to same user

### 6.6 API endpoints (new)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | /api/applications | requireAuth | List all applications for req.user.id; supports ?status, ?application_type, ?search, ?date_from (ISO date), ?date_to (ISO date), ?page (default 1), ?limit (default 25, max 100) query params; no year constraint |
| POST | /api/applications | requireAuth | Create an application |
| GET | /api/applications/:id | requireAuth + ownership | Get a single application |
| PATCH | /api/applications/:id | requireAuth + ownership | Update fields including application_type and checklist_state |
| DELETE | /api/applications/:id | requireAuth + ownership | Soft-prompt cascade delete |
| GET | /api/contacts | requireAuth | List all contacts; ?contact_type, ?application_id, ?outreach_status filters |
| POST | /api/contacts | requireAuth | Create contact; application_id must belong to req.user.id if provided |
| GET | /api/contacts/:id | requireAuth + ownership | Get a single contact |
| PATCH | /api/contacts/:id | requireAuth + ownership | Update contact fields or status |
| DELETE | /api/contacts/:id | requireAuth + ownership | Delete contact and its interactions and templates |
| POST | /api/contacts/:id/interactions | requireAuth + ownership | Append an interaction log entry |
| GET | /api/contacts/:id/interactions | requireAuth + ownership | List interaction log entries |
| POST | /api/contacts/:id/templates | requireAuth + ownership | Attach a template to a contact |
| PATCH | /api/contacts/:id/templates/:tid | requireAuth + ownership | Update a template |
| DELETE | /api/contacts/:id/templates/:tid | requireAuth + ownership | Delete a template |
| POST | /api/applications/:id/contacts | requireAuth + ownership | Link a recruiter contact to an application |
| DELETE | /api/applications/:id/contacts/:cid | requireAuth + ownership | Unlink a recruiter contact from an application |
| GET | /api/tasks | requireAuth | List tasks; ?category, ?priority, ?status, ?application_id filters |
| POST | /api/tasks | requireAuth | Create a task manually |
| GET | /api/tasks/:id | requireAuth + ownership | Get a single task |
| PATCH | /api/tasks/:id | requireAuth + ownership | Update task status, priority, or due date |
| DELETE | /api/tasks/:id | requireAuth + ownership | Delete a task |
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
| GET | /api/watchlist | requireAuth | List all watchlist entries for req.user.id; supports ?search, ?priority, ?target_apply_year filters |
| POST | /api/watchlist | requireAuth | Create a watchlist entry |
| GET | /api/watchlist/:id | requireAuth + ownership | Get a single watchlist entry |
| PATCH | /api/watchlist/:id | requireAuth + ownership | Update a watchlist entry |
| DELETE | /api/watchlist/:id | requireAuth + ownership | Delete a watchlist entry |
| POST | /api/watchlist/:id/promote | requireAuth + ownership | Create an application from this entry pre-populated with company_name and industry, then delete the watchlist record |

---

## 7. Out of Scope for v2.0

- Email integration of any kind (outreach emails, notification digests, follow-up reminders) — planned for v3.0
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
| Contact email field creates expectation of email send functionality | High | Low | Label field as reference only; no mailto links in v2.0 |
| Data model changes require migration of existing application records | High | Low | All new entities are additive; jobs table untouched during rollout |
| In-app notification panel adds UI complexity to the header | Low | Low | Keep bell icon and badge simple; full panel only opens on click |
| Unified contacts model creates confusion about recruiter vs. company contact | Low | Medium | Clear visual differentiation in the UI with contact_type badge |

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
- [ ] Tasks past due date are automatically escalated to High priority
- [ ] Task can be marked complete with a single click
- [ ] Completed tasks move to a Done section
- [ ] Task list supports filtering by category, priority, status, linked company

### Feature 4 — Application Type

- [ ] Application Type dropdown appears on every application detail view
- [ ] Color-coded type tag appears in the Applications tab application list
- [ ] Changing type to Recruiter-Assisted suppresses checklist steps 6–12
- [ ] Changing type to Referral suppresses checklist steps 9–12
- [ ] Changing type cancels no-longer-applicable auto-generated tasks

### Feature 5 — Interview Tracker

- [ ] Global Interviews tab shows all interview records sorted by scheduled_at ascending
- [ ] Filter bar correctly filters by interview type with count badges
- [ ] Scheduling a Phone Screen auto-creates prep task and thank-you task
- [ ] Scheduling any interview auto-checks Step 15 of that application's checklist
- [ ] Prep reminder callout appears when any interview is within 24 hours
- [ ] Interview routes return 403 when a user accesses another user's record

### Feature 6 — Notifications

- [ ] Notification bell icon appears in the app header with an unread badge count
- [ ] Clicking the bell opens a dropdown panel listing unread notifications
- [ ] Each notification shows type icon, description, timestamp, and a navigation link
- [ ] Opening the panel marks all notifications as read and clears the badge
- [ ] Notification preferences page is accessible from the hamburger menu
- [ ] Master on/off toggle prevents all in-app notifications when off
- [ ] Individual toggles correctly suppress notification creation for each event type
- [ ] `notification_log` records every generated in-app notification

### Feature 7 — Playbook

- [ ] Playbook is accessible from the hamburger menu
- [ ] Playbook content mentions cover letter templates and links to Contacts
- [ ] Step 2's "in" is clearly labeled as the cover letter differentiator
- [ ] Playbook is read-only (no checkboxes) — reference only

### Navigation

- [ ] Four primary tabs render at all viewport widths
- [ ] Hamburger menu contains Playbook, Companies To Watch, Notifications, Profile, Sign out
- [ ] On mobile (<768px), primary tabs render as bottom navigation bar
- [ ] Bottom nav never wraps — scrolls horizontally if needed
- [ ] All tab content stacks to single-column on viewports below 600px

### Feature 8 — Companies To Watch

- [ ] Companies To Watch page is accessible from the hamburger menu
- [ ] User can add, edit, and delete watchlist entries
- [ ] List is searchable by company name and filterable by priority and target apply year
- [ ] "Start Application" button creates a new application pre-populated with company name and industry, removes the watchlist entry, and navigates to the new record
- [ ] Watchlist entries are scoped to the authenticated user (403 on unauthorized access)

---

## 10. Revision History

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0 | April 24, 2026 | Teial Dickens | Initial draft |
| 2.0 | April 27, 2026 | Teial Dickens | Navigation simplified; Contacts and Recruiters unified; Playbook moved to menu; Notifications added; persona removed; schema expanded |
| 2.1 | April 28, 2026 | Teial Dickens | Notifications scoped to in-app only; email delivery moved to v3.0; notification schema simplified |
| 2.2 | April 28, 2026 | Teial Dickens | Removed year constraint from Applications tab; added date range filter and server-side pagination; added Companies To Watch feature |
| 2.3 | April 30, 2026 | Teial Dickens | Renamed "Jobs" tab to "Applications" (abbreviated "Apps" on mobile) throughout |
