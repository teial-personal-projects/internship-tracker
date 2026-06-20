import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const SUPABASE_URL             = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY        = getEnv('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

// Service-role client — only used to verify JWTs in auth middleware
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Per-request client that fires RLS using the user's JWT
export function createUserClient(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
