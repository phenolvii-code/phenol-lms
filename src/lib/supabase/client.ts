import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://krzzaqhzlmfbjcjtkpax.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_xF0aO99PJsEsh65KA1dAjQ_fmo5otP3';
  return createBrowserClient(url, key);
}
