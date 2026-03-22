import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthRequest extends Request {
  user: User;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as AuthRequest).user = data.user;
  next();
}
