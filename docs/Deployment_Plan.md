# Internship Tracker Deployment Plan

This document provides step-by-step instructions for deploying Internship Tracker to production.

---

## Deployment Overview

**Architecture:**
- **Frontend**: React/Vite app on Cloudflare Pages (Free)
- **Backend**: Express/Node.js API on Railway (~$5/month)
- **Database**: Supabase PostgreSQL (Free tier)

**Total Monthly Cost:** ~$5/month

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] All code committed and pushed to GitHub (`teial-personal-projects/internship-tracker`)
- [ ] Supabase project created and schema applied
- [ ] Railway account created (https://railway.app)
- [ ] Cloudflare account created (https://dash.cloudflare.com)
- [ ] `.env.dev` and `.env.prod` files populated with real values (never commit these)

---

## Part 1: Database Setup (Supabase)

### 1.1 Apply Database Schema

The Supabase project is already created. Apply all SQL files in order via the **SQL Editor** in the Supabase Dashboard:

1. Go to https://supabase.com/dashboard → your project → **SQL Editor**
2. Run `supabase-migration.sql` (core tables: jobs, user_profiles)
3. Run `job-boards.sql` (job_boards table + seed data)
4. Run `seed-jobs.sql` if you want sample job data

### 1.2 Verify Supabase Credentials

Go to **Project Settings → API** and confirm you have:

- **Project URL** → `SUPABASE_URL`
- **anon/public key** → `SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — backend only)

These are already set in your `api/.env.dev` and `api/.env.prod` files.

### 1.3 Verify Row-Level Security

Confirm RLS is enabled on all tables:
- `jobs` — users can only see their own jobs
- `user_profiles` — users can only see their own profile
- `job_boards` — public read (no user restriction needed)

---

## Part 2: Backend Deployment (Railway)

### 2.1 Create Railway Config File

Create `api/railway.json` in the repo:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build -w shared && npm run build -w api && npm start -w api",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

> **Note:** Railway runs `npm run build` (compiles TypeScript to `dist/`) then `npm start` (`node dist/index.js`).

### 2.2 Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway and select `teial-personal-projects/internship-tracker`
5. When prompted for a service, select the **`api`** directory (or configure root directory in settings)

### 2.3 Configure Railway Service Settings

1. Click on your deployed service
2. Go to **Settings → General**
3. Set **Root Directory**: `/` (leave empty — Railway needs access to the full monorepo to build `shared` first)
4. Set **Config as Code**: point to `api/railway.json`

### 2.4 Set Railway Environment Variables

In Railway Dashboard → your service → **Variables**, add:

```
SUPABASE_URL=https://vhfpemdmpscnwrqbateu.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=production
ALLOWED_ORIGINS=https://internship-tracker.pages.dev
```

> `PORT` is set automatically by Railway — do not set it manually.

> Update `ALLOWED_ORIGINS` once you have your final Cloudflare Pages URL. You can comma-separate multiple origins:
> `ALLOWED_ORIGINS=https://internship-tracker.pages.dev,https://yourcustomdomain.com`

### 2.5 Configure Railway Environments (Dev vs Prod)

Railway supports multiple environments tied to git branches:

- **development** environment → deploys from `dev` branch
- **production** environment → deploys from `main` branch

To set up:
1. Railway Dashboard → your project → click environment dropdown (top left)
2. Click **"New Environment"** → name it `development`
3. Set it to deploy from the `dev` branch
4. Configure its own set of Variables (can use same Supabase project for now)

Railway automatically sets:
- `RAILWAY_ENVIRONMENT_NAME` — environment name
- `RAILWAY_GIT_BRANCH` — branch deployed

### 2.6 Verify Backend Deployment

Once deployed, Railway gives you a URL like `https://internship-tracker-api.up.railway.app`.

**Test the health endpoint:**
```bash
curl https://internship-tracker-api.up.railway.app/health
```

Expected response:
```json
{ "ok": true }
```

**Verify auth is required (should return 401):**
```bash
curl https://internship-tracker-api.up.railway.app/api/jobs
```

Expected:
```json
{ "error": "Missing Authorization header" }
```

**Get a JWT for testing** (via Supabase auth API):
```bash
curl -X POST 'https://vhfpemdmpscnwrqbateu.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "your@email.com", "password": "yourpassword" }'
```

Save the `access_token` and test an authenticated endpoint:
```bash
curl https://internship-tracker-api.up.railway.app/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `{ "data": [] }` (empty array if no jobs yet)

### 2.7 Configure Health Checks

1. Railway Dashboard → your service → **Settings → Health Checks**
2. Set health check path: `/health`
3. Set timeout: `30` seconds

### 2.8 Enable Always-On

1. Railway Dashboard → your service → **Settings → Service**
2. Enable **"Always On"** (~$5/month)
3. This prevents cold starts and keeps the API responsive

---

## Part 3: Frontend Deployment (Cloudflare Pages)

### 3.1 Test Production Build Locally

Before deploying, verify the build works:

```bash
cd web
npm run build
npm run preview
```

Visit `http://localhost:4173` and confirm the app loads and can reach the API.

### 3.2 Deploy to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
4. Authorize Cloudflare and select `teial-personal-projects/internship-tracker`

### 3.3 Configure Build Settings

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `cd web && npm install && npm run build` |
| Build output directory | `web/dist` |
| Root directory | `/` (leave empty) |

### 3.4 Add Environment Variables

In Cloudflare Pages → **Environment variables**, add for **Production**:

```
VITE_SUPABASE_URL=https://vhfpemdmpscnwrqbateu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://internship-tracker-api.up.railway.app
```

And for **Preview** (dev branch deployments):
```
VITE_SUPABASE_URL=https://vhfpemdmpscnwrqbateu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://internshiptracker-dev.up.railway.app
```

> Never add `VITE_SUPABASE_SERVICE_ROLE_KEY` here — it would be exposed publicly in the JS bundle.

### 3.5 Deploy

1. Click **"Save and Deploy"**
2. Wait for build to complete (~2–5 minutes)
3. Cloudflare provides a URL: `https://internship-tracker.pages.dev`

### 3.6 Update ALLOWED_ORIGINS on Railway

Now that you have your Cloudflare URL, go back to Railway and update:

```
ALLOWED_ORIGINS=https://internship-tracker.pages.dev
```

Railway will redeploy automatically.

### 3.7 Verify Frontend Deployment

1. Visit `https://internship-tracker.pages.dev`
2. **Test login** — log in with your Supabase credentials
3. **Test job CRUD** — add a job, edit it, delete it
4. **Test filters** — verify Active, Due Soon, Stale filters work
5. **Test Job Boards page** — confirm boards load from the database
6. **Test profile** — update your name/major and save
7. **Test mobile** — open on a phone, verify card view and dropdown filter

### 3.8 Configure Custom Domain (Optional)

1. Cloudflare Pages → your project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain (e.g., `tracker.yourdomain.com`)
4. Follow DNS instructions
5. Add the custom domain to `ALLOWED_ORIGINS` in Railway

---

## Part 4: Post-Deployment

### 4.1 Monitoring

**Railway (Backend)**
- Dashboard → **Observability** — view request logs and errors
- Watch for 5xx errors after deploys

**Supabase (Database)**
- Dashboard → **Reports** — monitor DB size (stay under 500MB free tier limit)
- Dashboard → **Logs** — check for slow queries or auth errors

**Cloudflare (Frontend)**
- Dashboard → **Analytics** — page views, error rates

### 4.2 Database Backups

- Supabase free tier provides **7 days** of automatic daily backups
- Dashboard → **Database → Backups** to verify

### 4.3 Updating the App

**Backend changes:**
1. Push to `dev` or `main` branch
2. Railway auto-deploys on push (~1–2 minutes)

**Frontend changes:**
1. Push to `dev` or `main` branch
2. Cloudflare Pages auto-deploys on push (~2–3 minutes)

**Database schema changes:**
1. Write a new SQL migration file
2. Run it manually in Supabase SQL Editor

---

## Environment Variable Reference

### Railway (Backend)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |
| `NODE_ENV` | `production` or `development` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs |
| `PORT` | Set automatically by Railway — do not set |

### Cloudflare Pages (Frontend)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Railway backend URL (e.g. `https://your-app.railway.app`) |
