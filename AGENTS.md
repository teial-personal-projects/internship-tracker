# Track My Application — Codex Guidelines

## Project context

Track My Application is a monorepo job-search app with these workspaces:

- `web/` — React, Vite, TypeScript, Tailwind frontend.
- `api/` — Express, TypeScript REST API.
- `shared/` — shared Zod schemas and inferred TypeScript types.
- `migrations/` — database migrations and the full rebuild schema.
- `docs/` — PRDs, SDD, and implementation plans.

The app currently centers on Applications, Contacts, Action Items, Companies To Watch, and Discover/Radar. Radar is a job discovery surface: it should surface roles, open the original posting, and optionally save the company. Radar should not create Applications records or force application tracking.

## Orientation checklist

When starting work in a new chat, read the smallest relevant set of files before editing:

- Product and architecture: `docs/application-tracker-sdd.md`, then the relevant PRD or implementation plan.
- Radar valid-posting work: `docs/RADAR-VALID-POSTINGS-IMPLEMENTATION-PLAN.md`.
- Shared contract: `shared/src/schemas.ts`.
- API route/service work: relevant files in `api/src/routes/` and `api/src/radar/`.
- Discover and watchlist UI work: `web/src/pages/RadarPage.tsx`, `web/src/pages/WatchlistPage.tsx`, `web/src/api/`, and `web/src/hooks/`.
- Database work: the new migration plus `migrations/prod_full_v2_schema.sql`.

When adding migrations, always update `migrations/prod_full_v2_schema.sql` so a fresh database can be created without replaying a long migration chain.

## Markdown files

All `.md` files must pass markdownlint with zero warnings. Apply these rules whenever generating or editing markdown:

- **Table separators** — always use `| --- |` style (space-dash-space) in every separator row. Never use `|---|` or `|-----|`.
- **Lists** — always place a blank line before the first list item and after the last list item when the list is preceded or followed by non-list content.
- **Headings** — always place a blank line before and after every heading. Never place a heading directly adjacent to a list or paragraph without a blank line between them.
- **Bold as headings** — never use `**bold text**` as a standalone paragraph to serve as a section heading. Use the appropriate heading level (`####`, `#####`, etc.) instead.
- **Inline bold** — bold (`**text**`) is fine when it appears inside a sentence alongside other text, but never as the sole content of a paragraph.

## Implementation plans

Implementation plans should use simple two-level numbered checklists:

- Use top-level sections like `## Step 1 — Data Model`.
- Under each step, number tasks as `1.1 [ ]`, `1.2 [ ]`, `2.1 [ ]`, and so on.
- Do not use deeper nested numbering such as `1.2.3`.
- Keep the `[ ]` marker directly beside the numbered task so the item is easy to mark complete.
