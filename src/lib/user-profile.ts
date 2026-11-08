import { AuthUser } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { recordRegisteredStudent } from '@/lib/enrollment-storage';

const AVATAR_KEY_PREFIX = 'phenol_custom_avatar_';
const PROFILE_KEY_PREFIX = 'phenol_custom_profile_';
const ACTIVE_USER_KEY = 'phenol_auth_user';

/**
 * Compresses an image file from device to a lightweight, crystal-clear 300x300 JPEG data URL.
 * Produces ~15KB to 30KB payload instead of 5MB raw bytes, preventing localStorage QuotaExceededError.
 */
export const compressAvatarFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        try {
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          // Render clean anti-aliased image
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG at 0.86 quality (~20KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
          resolve(compressedDataUrl);
        } catch (e) {
          // Fallback to original read if canvas fails
          resolve(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Retrieves the permanently saved avatar for a given email address.
 * Checked BEFORE default stock photos to guarantee user uploads never vanish on refresh.
 */
export const getPersistentAvatar = (email?: string, fallbackDefault?: string): string => {
  if (!email || typeof window === 'undefined') {
    return fallbackDefault || '';
  }

  const clean = email.toLowerCase().trim();

  try {
    // 1. Direct isolated avatar key
    const isolated = localStorage.getItem(`${AVATAR_KEY_PREFIX}${clean}`);
    if (isolated && isolated.trim().length > 10) {
      return isolated;
    }

    // 2. Custom profile snapshot key
    const customProfileRaw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${clean}`);
    if (customProfileRaw) {
      const parsed = JSON.parse(customProfileRaw);
      if (parsed?.avatar && parsed.avatar.trim().length > 10) {
        return parsed.avatar;
      }
    }

    // 3. Active session key
    const activeRaw = localStorage.getItem(ACTIVE_USER_KEY);
    if (activeRaw) {
      const active = JSON.parse(activeRaw);
      if (active?.email?.toLowerCase().trim() === clean && active?.avatar && active.avatar.trim().length > 10) {
        return active.avatar;
      }
    }
  } catch (e) {}

  return fallbackDefault || '';
};

/**
 * Retrieves all custom profile fields (name, title, bio, specialization, phone, track)
 * for a user to protect against OAuth / session overwrites.
 */
export const getPersistentProfile = (email?: string): Partial<AuthUser> | null => {
  if (!email || typeof window === 'undefined') return null;
  const clean = email.toLowerCase().trim();

  try {
    const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${clean}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
};

/**
 * Permanently saves user profile across:
 * 1. Isolated user storage key (immune to session refresh wipe)
 * 2. Active session storage key (`phenol_auth_user`)
 * 3. Supabase Auth `user_metadata`
 * 4. Supabase Database `public.registered_students` table (for students)
 * 5. Window event dispatch for instant UI synchronization
 */
export const saveUserProfile = async (user: AuthUser): Promise<AuthUser> => {
  if (!user || !user.email) return user;
  const clean = user.email.toLowerCase().trim();

  const completeUser: AuthUser = {
    ...user,
    email: clean,
  };

  if (typeof window !== 'undefined') {
    try {
      // 1. Save isolated avatar key
      if (completeUser.avatar && completeUser.avatar.trim().length > 0) {
        localStorage.setItem(`${AVATAR_KEY_PREFIX}${clean}`, completeUser.avatar);
      }

      // 2. Save isolated profile snapshot
      localStorage.setItem(`${PROFILE_KEY_PREFIX}${clean}`, JSON.stringify(completeUser));

      // 3. Save active user
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(completeUser));

      // 4. Update student directory if student
      if (completeUser.role === 'STUDENT') {
        recordRegisteredStudent(completeUser);
      }

      // 5. Notify all components listening on same window
      window.dispatchEvent(new CustomEvent('phenol_profile_updated', { detail: completeUser }));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }

  // 6. Asynchronous Cloud Persistence to Supabase
  try {
    await supabase.auth.updateUser({
      data: {
        avatar: completeUser.avatar,
        avatar_url: completeUser.avatar,
        name: completeUser.name,
        full_name: completeUser.name,
        phone: completeUser.phone || completeUser.whatsapp,
        title: completeUser.title,
        specialization: completeUser.specialization,
        bio: completeUser.bio,
        academic_track: completeUser.academicTrack,
      },
    });
  } catch (err) {
    // Non-blocking if offline
  }

  try {
    if (completeUser.role === 'STUDENT') {
      await supabase.from('registered_students').upsert(
        {
          id: completeUser.id || `stu-${Date.now()}`,
          email: clean,
          name: completeUser.name,
          phone: completeUser.phone || completeUser.whatsapp || 'Pending WhatsApp Verification',
          academic_code: completeUser.academicCode || 'PH-SCHOLAR',
          academic_track: completeUser.academicTrack || 'Public Secondary AR',
          avatar: completeUser.avatar,
          role: 'STUDENT',
          last_active: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    }
  } catch (err) {
    // Non-blocking if offline
  }

  return completeUser;
};
