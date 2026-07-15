import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import type { Database } from '../types/database';

const fallbackUrl = 'https://example.supabase.co';
const fallbackKey = 'missing-anon-key-for-local-shell-only';

export const supabase = createClient<Database>(
  env.supabaseUrl ?? fallbackUrl,
  env.supabaseAnonKey ?? fallbackKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
