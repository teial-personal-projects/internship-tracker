-- ============================================================
-- job_boards table
-- Public read-only reference data protected by explicit grants
-- and a read-only RLS policy.
-- ============================================================

create table if not exists job_boards (
  id          uuid primary key default gen_random_uuid(),
  label       text        not null,
  url         text        not null,
  description text        not null,
  category    text        not null,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Data API grants: public read-only reference data.
REVOKE ALL PRIVILEGES ON TABLE public.job_boards FROM anon, authenticated;
GRANT SELECT ON TABLE public.job_boards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_boards TO service_role;

-- Allow anyone (authenticated or anonymous) to read.
alter table job_boards enable row level security;

create policy "job_boards_public_read"
  on job_boards for select
  to anon, authenticated
  using (true);

-- ============================================================
-- Seed data
-- ============================================================

insert into job_boards (label, url, description, category, sort_order) values

  -- General
  ('LinkedIn',          'https://www.linkedin.com/jobs',                     'Largest professional network with extensive internship listings',  'General',                1),
  ('Indeed',            'https://www.indeed.com',                            'Broad job aggregator with strong internship coverage',             'General',                2),
  ('Glassdoor',         'https://www.glassdoor.com/Job/internship-jobs.htm', 'Job listings with company reviews and salary data',               'General',                3),
  ('ZipRecruiter',      'https://www.ziprecruiter.com',                      'AI-matched job listings across all industries',                    'General',                4),

  -- Students & Internships
  ('Handshake',         'https://joinhandshake.com',                         'The go-to platform for college student internships',              'Students & Internships', 10),
  ('WayUp',             'https://www.wayup.com',                             'Internships and entry-level jobs for students',                   'Students & Internships', 11),
  ('Chegg Internships', 'https://www.internships.com',                       'Dedicated internship search engine',                              'Students & Internships', 12),
  ('Parker Dewey',      'https://www.parkerdewey.com',                       'Micro-internships and short-term professional projects',          'Students & Internships', 13),

  -- Tech
  ('Levels.fyi',        'https://www.levels.fyi/internships',                'Tech internships with compensation data',                         'Tech',                   20),
  ('Simplify',          'https://simplify.jobs',                             'One-click applications for tech internships',                     'Tech',                   21),
  ('AngelList',         'https://wellfound.com/jobs',                        'Startup jobs and internships',                                    'Tech',                   22),
  ('Dice',              'https://www.dice.com',                              'Technology-focused job listings',                                 'Tech',                   23),

  -- Remote
  ('Remotive',          'https://remotive.com',                              'Curated remote tech jobs and internships',                        'Remote',                 30),
  ('We Work Remotely',  'https://weworkremotely.com',                        'Remote-only job board across multiple fields',                    'Remote',                 31);
