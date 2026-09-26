import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const isConfigured =
  config.supabaseUrl &&
  config.supabaseUrl.startsWith('http') &&
  config.supabaseServiceRoleKey &&
  !config.supabaseUrl.includes('mock-supabase');

export const supabase = isConfigured
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
  : null;

export const isSupabaseConfigured = (): boolean => !!supabase;
