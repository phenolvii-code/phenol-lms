'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/types/auth';

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 1. Fetch role from public.profiles (ONLY source of truth)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      const isInstructor = profile?.role === 'instructor';
      const role: UserRole = isInstructor ? 'INSTRUCTOR' : 'STUDENT';

      // 2. Fetch student details from public.registered_students if student
      let studentDetails: {
        name?: string;
        phone?: string;
        academic_code?: string;
        academic_track?: string;
      } | null = null;

      if (!isInstructor) {
        const { data: student } = await supabase
          .from('registered_students')
          .select('name, phone, academic_code, academic_track')
          .eq('id', authUser.id)
          .single();
        studentDetails = student;
      }

      const displayName = isInstructor
        ? 'Dr. Omar Magdi'
        : (studentDetails?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student');

      const phone = studentDetails?.phone || authUser.user_metadata?.phone || authUser.user_metadata?.whatsapp;

      const appUser: AuthUser = {
        id: authUser.id,
        email: authUser.email || '',
        name: displayName,
        phone,
        whatsapp: phone,
        role,
        academicCode: studentDetails?.academic_code,
        academicTrack: studentDetails?.academic_track || 'Public Secondary AR',
        registeredAt: authUser.created_at,
        title: isInstructor ? 'Academic Director & Senior Fellow' : undefined,
        specialization: isInstructor ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined,
      };

      setUser(appUser);
    } catch (err) {
      console.error('Error fetching current user:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        fetchUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    role: user?.role || 'GUEST',
    isInstructor: user?.role === 'INSTRUCTOR',
    isStudent: user?.role === 'STUDENT',
    isLoading,
    signOut,
    refreshUser: fetchUserProfile,
  };
}
