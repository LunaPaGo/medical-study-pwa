import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20).optional()
});

const parsedEnv = envSchema.safeParse(import.meta.env);

export const env = {
  supabaseUrl: parsedEnv.success ? parsedEnv.data.VITE_SUPABASE_URL : undefined,
  supabaseAnonKey: parsedEnv.success ? parsedEnv.data.VITE_SUPABASE_ANON_KEY : undefined,
  isSupabaseConfigured:
    parsedEnv.success &&
    Boolean(parsedEnv.data.VITE_SUPABASE_URL && parsedEnv.data.VITE_SUPABASE_ANON_KEY)
};
