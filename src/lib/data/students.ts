import { supabase } from '@/lib/supabase';

export interface RegisteredStudentRow {
  id: string;
  email: string;
  name: string;
  phone?: string;
  academic_code?: string;
  academic_track?: string;
  role: string;
  registered_at?: string;
  last_active?: string;
}

export async function listAllStudents(): Promise<RegisteredStudentRow[]> {
  const { data, error } = await supabase
    .from('registered_students')
    .select('*')
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Error listing registered students (admin):', error);
    return [];
  }
  return data || [];
}

export async function getOwnStudentProfile(): Promise<RegisteredStudentRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('registered_students')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching student profile:', error);
    return null;
  }
  return data;
}

export async function updateOwnStudentProfile(updates: {
  name?: string;
  phone?: string;
  academic_track?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('registered_students')
    .update({
      ...updates,
      last_active: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
}
