import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const isConfigured =
  process.env.USE_MOCK_DB !== 'true' &&
  config.supabaseUrl &&
  config.supabaseUrl.startsWith('http') &&
  config.supabaseServiceRoleKey &&
  !config.supabaseUrl.includes('mock-supabase') &&
  !config.supabaseUrl.includes('your-supabase-project') &&
  !config.supabaseServiceRoleKey.includes('your-supabase-service-role-key');

export const supabase = isConfigured
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  if (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test') {
    return false;
  }
  return !!supabase;
};

