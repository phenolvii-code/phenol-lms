import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://krzzaqhzlmfbjcjtkpax.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_xF0aO99PJsEsh65KA1dAjQ_fmo5otP3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
