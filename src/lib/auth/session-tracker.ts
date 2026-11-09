'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const DEVICE_ID_KEY = 'phenol_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function registerDeviceSession(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return true;

    const deviceId = getDeviceId();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    const { error } = await supabase.rpc('register_session', {
      p_device_id: deviceId,
      p_user_agent: userAgent,
    });

    if (error) {
      console.warn('Session registration notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('registerDeviceSession failed:', err);
    return false;
  }
}

export async function verifyDeviceSession(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return true;

    const deviceId = getDeviceId();
    const { data, error } = await supabase.rpc('check_session', {
      p_device_id: deviceId,
    });

    if (error) {
      console.warn('Session verification notice:', error.message);
      return true; // Don't falsely kick out on network glitch
    }

    return Boolean(data);
  } catch (err) {
    return true;
  }
}

/**
 * Hook to enforce maximum 2 devices per student account.
 * Triggers onSessionEvicted if an active session is pushed out by a 3rd device.
 */
export function useSessionEnforcer(onSessionEvicted?: () => void) {
  const [isEvicted, setIsEvicted] = useState(false);

  const check = useCallback(async () => {
    const isValid = await verifyDeviceSession();
    if (!isValid) {
      setIsEvicted(true);
      if (onSessionEvicted) {
        onSessionEvicted();
      } else {
        await supabase.auth.signOut().catch(() => {});
        if (typeof window !== 'undefined') {
          window.location.href = '/login?evicted=max_devices';
        }
      }
    }
  }, [onSessionEvicted]);

  useEffect(() => {
    registerDeviceSession().then(() => {
      // Check every 60 seconds
      const interval = setInterval(check, 60000);
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          check();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
  }, [check]);

  return { isEvicted };
}
