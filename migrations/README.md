# Migrations

Numbered SQL migration files for Track My Application v2.0.

## File naming

```text
v2_NNN_description.sql
```

Each file contains an `-- UP` block and a `-- DOWN` block.

## Running a migration

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard) for this project.
2. Copy the contents of the `-- UP` block from the migration file.
3. Paste into the SQL Editor and click **Run**.
4. Verify the output matches the expected result noted in the file.

## Rolling back a migration

1. Copy the contents of the `-- DOWN` block from the migration file.
2. Paste into the SQL Editor and click **Run**.
3. To roll back multiple migrations, run DOWN blocks in **reverse order** (highest number first).

## Migration order

| File | Description |
| --- | --- |
| `v2_000_verify_baseline.sql` | Verify `jobs` and `job_boards` tables exist |
| `v2_001_enums.sql` | Create all v2 enum types |
| `v2_002_applications.sql` | Create `applications` table |
| `v2_003_contacts.sql` | Create `contacts` table |
| `v2_004_contact_interactions.sql` | Create `contact_interactions` table |
| `v2_005_contact_templates.sql` | Create `contact_templates` table |
| `v2_006_application_contacts.sql` | Create `application_contacts` join table |
| `v2_007_tasks.sql` | Create `tasks` table |
| `v2_008_interviews.sql` | Create `interviews` table |
| `v2_009_notifications.sql` | Create `notification_preferences` and `notification_log` tables |
| `v2_010_company_watchlist.sql` | Create `company_watchlist` table |
| `v2_011_import_jobs.sql` | Import existing `jobs` data into `applications` |
| `v2_012_application_events.sql` | Create `application_events` table |
| `v2_013_contacts_company.sql` | Add `company` column to `contacts` table |

For existing v2 environments where some migrations were already applied before
explicit Data API grants were added, run `../supabase-grants.sql` once after the
latest migration.

## Important rules

- The `jobs` and `job_boards` tables are **never modified** by any v2 migration.
- Always run `v2_000_verify_baseline.sql` first to confirm the baseline tables exist.
- Never skip a migration number — apply them strictly in order.
- Each migration is independent and idempotent where possible (`IF NOT EXISTS`, `IF EXISTS`).
