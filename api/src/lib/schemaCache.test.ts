import { describe, expect, it, vi } from 'vitest';
import { isMissingApplicationSourceColumn, sendApplicationSourceMigrationError } from './schemaCache';
import type { Response } from 'express';

describe('schema cache helpers', () => {
  it('detects missing application source columns from Supabase schema cache errors', () => {
    expect(isMissingApplicationSourceColumn({
      message: "Could not find the 'source' column of 'applications' in the schema cache",
    })).toBe(true);
    expect(isMissingApplicationSourceColumn({
      message: "Could not find the 'source_metadata' column of 'applications' in the schema cache",
    })).toBe(true);
    expect(isMissingApplicationSourceColumn({ message: 'other failure' })).toBe(false);
  });

  it('sends a migration-specific error response', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    expect(sendApplicationSourceMigrationError(res, {
      message: "Could not find the 'source' column of 'applications' in the schema cache",
    })).toBe(true);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Applications source columns are missing. Run migrations/v2_015_application_source.sql, then reload the Supabase schema cache.',
    });
  });
});
