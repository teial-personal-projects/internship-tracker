import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// Service-role client — only used to verify JWTs in auth middleware
export const supabaseAdmin = createClient(
  getEnv('SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Per-request client that fires RLS using the user's JWT
export function createUserClient(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
