import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const isConfigured =
  process.env.USE_TEST_STORE !== 'true' &&
  Boolean(
    config.supabaseUrl &&
    config.supabaseUrl.startsWith('http') &&
    config.supabaseServiceRoleKey &&
    !config.supabaseUrl.includes('mock-supabase') &&
    !config.supabaseUrl.includes('your-supabase-project') &&
    !config.supabaseServiceRoleKey.includes('your-supabase-service-role-key')
  );

export const supabase = isConfigured
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const isSupabaseConfigured = (): boolean =>
  process.env.USE_TEST_STORE !== 'true' && !!supabase;


