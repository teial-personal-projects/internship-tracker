import type { Response } from 'express';

const APPLICATION_SOURCE_MIGRATION_MESSAGE =
  'Applications source columns are missing. Run migrations/v2_015_application_source.sql, then reload the Supabase schema cache.';

export function isMissingApplicationSourceColumn(error: { message?: string } | null | undefined): boolean {
  const message = error?.message ?? '';
  return (
    message.includes("Could not find the 'source' column")
    || message.includes("Could not find the 'source_metadata' column")
  );
}

export function sendApplicationSourceMigrationError(
  res: Response,
  error: { message?: string } | null | undefined,
): boolean {
  if (!isMissingApplicationSourceColumn(error)) return false;

  res.status(500).json({ error: APPLICATION_SOURCE_MIGRATION_MESSAGE });
  return true;
}
