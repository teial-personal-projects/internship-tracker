# Track My Application — System Design Document

**Version:** 2.5
**Date:** June 16, 2026
**Status:** In Progress

---

## 1. Overview

Track My Application is a job application workflow system. It tracks applications,
contacts, outreach tasks, companies to watch, and discovered job postings from
monitored applicant tracking system feeds.

The V2 architecture replaces the original `jobs`-centered tracker with an
`applications`-centered model. The original `jobs` and `job_boards` tables remain
for migration and backwards compatibility, but new V2 feature work targets the
`applications` table and related V2 entities.

The PRD defines product behavior and acceptance criteria. This document owns the
technical design: architecture, data model, API surface, security, jobs, and
frontend module boundaries.

---

## 2. Architecture

The application is a monorepo with three workspaces:

| Workspace | Purpose |
| --- | --- |
| `shared/` | Shared TypeScript types, constants, and Zod schemas |
| `api/` | Express REST API, validation, business logic, and DB access |
| `web/` | React SPA, route shell, pages, components, and API clients |

Deployment topology:

```text
Browser
  -> Cloudflare Pages (React SPA)
  -> Railway (Express API)
  -> Supabase (PostgreSQL + Auth)
```

The web app uses Supabase directly only for authentication. Application data
flows through the Express API, which creates a per-request Supabase client scoped
with the authenticated user's JWT.

---

## 3. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Routing | React Router v6 |
| Server state | TanStack Query |
| HTTP client | Axios |
| UI primitives | Radix UI, Sonner, lucide-react |
| Backend | Node.js 20+, Express, TypeScript |
| Validation | Zod schemas in `shared/` |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth with JWTs |
| Hosting | Cloudflare Pages frontend, Railway API |

---

## 4. Design Tokens

V2 uses the Terracotta Daylight direction: warm cream canvas, deep navy ink,
terracotta primary actions, and sage/sun/violet/rose support colors.

Design tokens live in `web/src/index.css` and are referenced by component code
through CSS variables. Component files should not hard-code raw hex values unless
the value is a documented token fallback.

Core tokens:

| Token | Purpose |
| --- | --- |
| `--bg` | Page background |
| `--card` | Card and modal surface |
| `--soft`, `--softer` | Chip backgrounds, row hover, subtle fills |
| `--line`, `--line-soft` | Borders and dividers |
| `--ink`, `--ink-2`, `--ink-3`, `--ink-4` | Text scale |
| `--accent`, `--accent-dark`, `--accent-soft` | Primary brand/action |
| `--sage`, `--sage-soft` | Success and calm states |
| `--sun`, `--sun-soft` | Attention states |
| `--violet`, `--violet-soft` | Technical and informational states |
| `--rose`, `--rose-soft` | Overdue and error states |

Typography:

| Role | Font |
| --- | --- |
| Display/body | Mona Sans, Inter, system sans |
| Data/timestamps/kickers | JetBrains Mono, system monospace |

Reusable UI rules:

- Primary actions use terracotta.
- Success uses sage.
- Errors and overdue states use rose.
- Interactive rows shift to `--softer` on hover.
- Cards may lift by 2px on hover with `--shadow-md`.
- No emoji in UI copy.
- Empty states are direct and instructional.

---

## 5. Data Model

### 5.1 Existing V1 Tables

The original `jobs`, `job_boards`, and `user_profiles` tables remain in place.
The V2 import copies data from `jobs` into `applications`; it does not delete or
modify `jobs`.

### 5.2 Applications

The `applications` table is the V2 replacement for `jobs`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `user_id` | UUID FK | `auth.users(id)` |
| `company` | TEXT | Required, max 200 |
| `title` | TEXT | Required, max 200 |
| `industry` | TEXT | Nullable, max 100 |
| `location` | TEXT | Nullable, max 200 |
| `job_link` | TEXT | Nullable URL |
| `app_link` | TEXT | Nullable URL |
| `status` | `application_status_enum` | Current pipeline status |
| `application_type` | `application_type_enum` | Nullable |
| `checklist_state` | JSONB | 18-step checklist state |
| `cover_letter` | TEXT | Nullable, max 5000 |
| `notes` | TEXT | Nullable, max 5000 |
| `pay` | TEXT | Nullable |
| `applied_date` | DATE | Nullable |
| `deadline` | DATE | Nullable |
| `added` | DATE | Defaults to current date |
| `source` | `application_source_enum` | `manual`, `imported`, `watchlist`, `radar` |
| `source_metadata` | JSONB | Source-specific metadata |
| `created_at` | TIMESTAMPTZ | Defaults to now |
| `updated_at` | TIMESTAMPTZ | Updated by trigger |

Indexes:

- `idx_applications_user_id`
- `idx_applications_status`
- `idx_applications_application_type`
- `idx_applications_added`
- `idx_applications_source`

### 5.3 Contacts

Contacts represent both company contacts and external recruiters.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK | `auth.users(id)` |
| `contact_type` | `contact_type_enum` | `company_contact`, `recruiter`, `other` |
| `application_id` | UUID FK | Required for company contacts |
| `company` | TEXT | Nullable standalone company name |
| `first_name` | TEXT | Required, max 100 |
| `last_name` | TEXT | Required, max 100 |
| `title` | TEXT | Nullable, max 200 |
| `email` | TEXT | Nullable, max 254 |
| `phone` | TEXT | Nullable, max 30 |
| `linkedin_url` | TEXT | Nullable URL |
| `agency` | TEXT | Nullable recruiter agency |
| `preferred_contact_method` | `preferred_contact_method_enum` | Nullable |
| `how_found` | `how_found_enum` | Nullable |
| `outreach_status` | `outreach_status_enum` | Company contacts only |
| `recruiter_status` | `recruiter_status_enum` | Recruiters only |
| `notes` | TEXT | Nullable, max 5000 |
| `date_of_last_outreach` | DATE | Updated on outreach status change |
| `created_at` | TIMESTAMPTZ | Defaults to now |
| `updated_at` | TIMESTAMPTZ | Updated by trigger |

Related tables:

- `contact_interactions`: chronological contact interaction log.
- `contact_templates`: reusable contact-specific templates.
- `application_contacts`: many-to-many recruiter-to-application links.

### 5.4 Tasks

Tasks drive the Action Items tab and auto-generated workflow reminders.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK | `auth.users(id)` |
| `title` | TEXT | Required, max 500 |
| `category` | `task_category_enum` | Application, outreach, research, recruiter, etc. |
| `priority` | `task_priority_enum` | `high`, `medium`, `low` |
| `status` | `task_status_enum` | `open`, `complete`, `skipped` |
| `due_date` | DATE | Nullable |
| `application_id` | UUID FK | Nullable, `ON DELETE SET NULL` |
| `contact_id` | UUID FK | Nullable, `ON DELETE SET NULL` |
| `notes` | TEXT | Nullable, max 2000 |
| `is_auto_generated` | BOOLEAN | Defaults false |
| `created_at` | TIMESTAMPTZ | Defaults to now |
| `updated_at` | TIMESTAMPTZ | Updated by trigger |

### 5.5 Companies To Watch

`company_watchlist` stores companies the user may apply to later. Radar settings
live on each watchlist entry.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK | `auth.users(id)` |
| `company_name` | TEXT | Required, max 200 |
| `industry` | TEXT | Nullable, max 100 |
| `website` | TEXT | Nullable URL |
| `notes` | TEXT | Nullable, max 5000 |
| `priority` | `task_priority_enum` | Nullable |
| `target_apply_year` | SMALLINT | Nullable |
| `added` | DATE | Defaults to current date |
| `ats_type` | `ats_type_enum` | Nullable |
| `ats_board_token` | TEXT | Nullable |
| `radar_enabled` | BOOLEAN | Defaults false |
| `last_refreshed_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Defaults to now |
| `updated_at` | TIMESTAMPTZ | Updated by trigger |

### 5.6 Application Events

`application_events` stores application-scoped timeline entries independent of
named contact interactions.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `application_id` | UUID FK | Required, `ON DELETE CASCADE` |
| `user_id` | UUID FK | `auth.users(id)` |
| `event_type` | `application_event_type_enum` | Required |
| `body` | TEXT | Nullable, max 5000 |
| `contact_id` | UUID FK | Nullable, `ON DELETE SET NULL` |
| `occurred_at` | TIMESTAMPTZ | Defaults to now |
| `created_at` | TIMESTAMPTZ | Defaults to now |

### 5.7 Discovered Postings

`discovered_postings` stores normalized ATS roles found by the Job Radar.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK | `auth.users(id)` |
| `watchlist_id` | UUID FK | `company_watchlist(id)`, `ON DELETE CASCADE` |
| `company_name` | TEXT | Denormalized display value |
| `external_job_id` | TEXT | ATS job id |
| `title` | TEXT | Role title |
| `location` | TEXT | Raw location string |
| `remote_status` | TEXT | Normalized location classification |
| `url` | TEXT | Posting URL |
| `posted_at` | TIMESTAMPTZ | Nullable |
| `first_seen_at` | TIMESTAMPTZ | Defaults to now |
| `status` | `posting_status_enum` | `new`, `seen`, `dismissed`, `promoted` |
| `raw_payload` | JSONB | Original ATS record |
| `created_at` | TIMESTAMPTZ | Defaults to now |

Deduplication is enforced by a unique constraint on
`(watchlist_id, external_job_id)`.

### 5.8 Dormant V3 Schema

The `interviews`, `notification_preferences`, and `notification_log` tables are
V3-owned. V2 does not expose active Interview Tracker or In-App Notification
behavior; V3 owns those features and their supporting schema.

---

## 6. Enums

Primary V2 enums:

- `application_status_enum`
- `application_source_enum`
- `application_type_enum`
- `contact_type_enum`
- `outreach_status_enum`
- `recruiter_status_enum`
- `task_category_enum`
- `task_priority_enum`
- `task_status_enum`
- `contact_interaction_type_enum`
- `contact_template_type_enum`
- `preferred_contact_method_enum`
- `how_found_enum`
- `application_event_type_enum`
- `ats_type_enum`
- `posting_status_enum`

The exact SQL enum values live in the migration files and shared Zod schemas.

---

## 7. Backend API

All routes except `/health` require a Supabase JWT in the `Authorization` header.
Record-level routes use explicit ownership checks:

1. Fetch by id without a user filter.
2. Return `404` if no record exists.
3. Return `403` if `record.user_id !== req.user.id`.
4. Proceed only after ownership is confirmed.

Route groups:

| Route group | Purpose |
| --- | --- |
| `/api/applications` | Application CRUD, filters, pagination, event log |
| `/api/contacts` | Contact CRUD, interactions, templates |
| `/api/tasks` | Task queue CRUD and quick-complete behavior |
| `/api/watchlist` | Companies To Watch CRUD and promote flow |
| `/api/radar/postings` | Discovered posting list, dismiss, promote |
| `/api/profile` | User profile settings |
| `/api/job-boards` | Legacy curated job board list |

The implementation plan owns exact route sequencing and tests.

---

## 8. Business Logic

### 8.1 Application Type Effects

- `cold_strategic` keeps the full checklist active.
- `recruiter_assisted` suppresses cold outreach checklist steps 6-12.
- `referral` suppresses checklist steps 9-12.
- Changing application type recalculates active checklist steps and skips
  auto-generated tasks that no longer apply.

### 8.2 Auto-Generated Tasks

V2 task generation runs from API-side mutations only:

- Applied cold strategic applications create same-day double-down tasks.
- Company contact `double_down_sent` creates follow-up tasks due in four
  business days.
- Cold strategic applications with no contact create a find-contact task.
- Recruiter-assisted applications suppress cold outreach tasks; recruiter
  follow-up tasks are manual in V2.
- Referral applications create referral thank-you tasks.
- Past-due tasks are visually marked in V2; scheduled overdue escalation moves
  to V3.

### 8.3 Job Radar

V2 Job Radar is manually refreshed. The refresh service reads one enabled
watchlist source, fetches ATS postings through an adapter registry, normalizes
each posting, filters by match criteria, and upserts new matches into
`discovered_postings`. Scheduled polling moves to V3.

Adapters return a common normalized shape:

| Field | Meaning |
| --- | --- |
| `externalId` | ATS job id |
| `title` | Posting title |
| `location` | Raw location |
| `remoteStatus` | Parsed remote or LA classification |
| `url` | Posting URL |
| `postedAt` | ATS timestamp when available |
| `raw` | Original ATS payload |

The MVP matcher keeps roles whose title signals seniority and whose location
reads remote US or Los Angeles.

---

## 9. Background Jobs

V2 does not register background jobs. Scheduled work is deferred to V3 and should
be registered from `api/src/index.ts` only when guarded by `ENABLE_BACKGROUND_JOBS`.

| Job | Cadence | Purpose |
| --- | --- | --- |
| `escalateOverdueTasks` | V3 daily | Escalate overdue open tasks and notify users |
| `pollRadarSources` | V3 every 30 minutes | Poll enabled ATS sources |

Jobs should not run during tests unless explicitly invoked. If the API is scaled
to multiple Railway instances, job execution should move to a single worker
process to avoid duplicate work.

---

## 10. Frontend Application

Primary V2 routes:

| Route | Page |
| --- | --- |
| `/applications` | Applications tab |
| `/contacts` | Contacts tab and per-application detail |
| `/radar` | Discover tab |
| `/action-items` | Action Items tab |
| `/watchlist` | Companies To Watch |
| `/profile` | Profile settings |

Deprecated V2 routes such as `/dashboard`, `/interviews`, `/playbook`, and
`/notifications` redirect to `/applications` until V3 restores the deferred
features.

Frontend data access is grouped by API client modules under `web/src/api/` and
TanStack Query hooks under `web/src/hooks/`.

---

## 11. Security

- Supabase Auth handles signup, login, email confirmation, and JWT issuance.
- The API validates JWTs through `requireAuth`.
- `req.user.id` is the only trusted user identifier.
- User-owned tables include `user_id` and enforce row-level security.
- Cross-entity writes verify linked record ownership before insert or update.
- Request bodies are validated by shared Zod schemas.
- Text fields are sanitized before storage.
- Service role credentials are never exposed to frontend code.
- CORS is restricted through `ALLOWED_ORIGINS`.
- Helmet sets standard HTTP security headers.

---

## 12. Deployment

See [Deployment_Plan.md](Deployment_Plan.md) for detailed deployment steps.

Summary:

- Frontend deploys to Cloudflare Pages.
- Backend deploys to Railway.
- Database and auth run on Supabase.
- SQL migrations are applied through the Supabase SQL Editor.
- `FEATURE_V2_ENABLED` may gate V2 API surfaces during staged rollout.
- V2 has no scheduled job startup. V3 uses `ENABLE_BACKGROUND_JOBS` for scheduled jobs.
