# Internship Tracker

A full-stack web application for tracking job applications, deadlines, and job boards. Built as a monorepo with a React frontend, Express API backend, and Supabase PostgreSQL database.

---

## Architecture

| Layer | Technology | Host |
| --- | --- | --- |
| Frontend | React + Vite + Tailwind CSS v4 | Cloudflare Pages |
| Backend | Express.js + TypeScript | Railway |
| Database | Supabase (PostgreSQL + Auth + RLS) | Supabase |

---

## Monorepo Structure

```text
internship-tracker/
├── api/          # Express.js REST API
├── web/          # React + Vite frontend
├── shared/       # Shared TypeScript types
├── docs/         # Deployment plan and documentation
├── nixpacks.toml # Railway build configuration
└── *.sql         # Database migration and seed files
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A Supabase project (for database and auth)

### Installation

```bash
# Clone the repo
git clone https://github.com/teial-personal-projects/internship-tracker.git
cd internship-tracker

# Install all workspace dependencies
npm install
```

### Environment Variables

#### `api/.env.dev`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5174
```

#### `web/.env.dev`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8080/api
```

### Running Locally

```bash
# Build shared types first
npm run build -w shared

# Start the API (terminal 1)
npm run dev -w api

# Start the frontend (terminal 2)
npm run dev -w web
```

The frontend runs at `http://localhost:5174` and proxies `/api` requests to `http://localhost:8080`.

---

## Database Setup

Run the following SQL files in order via the Supabase SQL Editor:

1. `supabase-migration.sql` — core tables, triggers, indexes, RLS policies
2. `job-boards.sql` — job_boards table and seed data

---

## Deployment

See [docs/Deployment_Plan.md](docs/Deployment_Plan.md) for full step-by-step instructions.

- **Backend** deploys to Railway from the `main` branch
- **Frontend** deploys to Cloudflare Pages from the `main` branch
- Railway uses `nixpacks.toml` to build only the `shared` and `api` workspaces

---

## Features

- Email/password authentication via Supabase Auth (email confirmation required)
- Add, edit, delete internship applications
- Track status, deadlines, pay, location, cover letter links, and more
- Smart alerts for upcoming deadlines and stale applications
- Quick filters: Active, Not Started, Applied, Due Soon, Stale, Archived, Conference, All
- Academic year filter (Aug–Jul cycle)
- Paginated results (15 per page)
- Sortable, draggable column headers
- Responsive design — table on desktop, card view on mobile
- Job Boards page with curated links to internship search sites
- User profile with major, preferred positions, and preferred locations
