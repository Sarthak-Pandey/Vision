import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szilariqsodwgqidxlbz.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aWxhcmlxc29kd2dxaWR4bGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzczMjksImV4cCI6MjEwNjA1MzMyOX0.a4mWgG4P0WiAx1osYR8nkOdY7Gr2bviMhKIbB8G2PI8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
