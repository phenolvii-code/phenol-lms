import { supabase } from '@/lib/supabase';

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'registered' | 'rewarded';
  points: number;
  created_at: string;
  rewarded_at?: string;
}

export async function listMyReferrals(): Promise<ReferralRecord[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
  return data || [];
}
