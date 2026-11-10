import { AuthUser } from '@/types/auth';
import { supabase } from '@/lib/supabase';

export const compressAvatarFile = async (file: File): Promise<string> => {
  return '';
};

export const getPersistentAvatar = (_email?: string, fallbackDefault?: string): string => {
  return fallbackDefault || '';
};

export const getPersistentProfile = (_email?: string): Partial<AuthUser> | null => {
  return null;
};

export const saveUserProfile = async (user: Partial<AuthUser>): Promise<void> => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    if (user.role === 'INSTRUCTOR') {
      await supabase
        .from('profiles')
        .update({
          full_name: user.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);
    } else {
      await supabase
        .from('registered_students')
        .update({
          name: user.name,
          phone: user.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);
    }
  } catch (err) {
    console.warn('Notice saving user profile:', err);
  }
};
