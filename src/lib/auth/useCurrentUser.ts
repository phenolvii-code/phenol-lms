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

      // 1. Fetch role from public.profiles (or user_metadata or fallback)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const isSuperAdmin = authUser.email?.toLowerCase() === 'phenolvii@gmail.com';
      const isInstructor =
        isSuperAdmin ||
        profile?.role === 'instructor' ||
        authUser.user_metadata?.role === 'instructor' ||
        authUser.user_metadata?.account_type === 'INSTRUCTOR';

      const role: UserRole = isSuperAdmin ? 'SUPER_ADMIN' : isInstructor ? 'INSTRUCTOR' : 'STUDENT';

      // 2. Fetch student details from public.registered_students if student
      let studentDetails: {
        name?: string;
        phone?: string;
        academic_code?: string;
        academic_track?: string;
      } | null = null;

      if (!isInstructor && !isSuperAdmin) {
        const { data: student } = await supabase
          .from('registered_students')
          .select('name, phone, academic_code, academic_track')
          .eq('id', authUser.id)
          .single();
        studentDetails = student;
      }

      // Check local cache for custom instructor profile updates
      let localProfile: any = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`phenol_instructor_profile_${authUser.id}`);
          if (raw) localProfile = JSON.parse(raw);
        } catch (e) {}
      }

      const localAvatar = typeof window !== 'undefined' ? localStorage.getItem(`phenol_avatar_${authUser.id}`) : null;
      const globalCached = typeof window !== 'undefined' ? localStorage.getItem('phenol_global_instructor_avatar') : null;
      const avatar =
        localProfile?.avatar ||
        localAvatar ||
        globalCached ||
        profile?.avatar_url ||
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.avatar ||
        undefined;

      const displayName =
        localProfile?.name ||
        authUser.user_metadata?.full_name ||
        (isSuperAdmin ? 'Dr. Omar Magdi' : studentDetails?.name || authUser.email?.split('@')[0] || 'Scholar');

      const phone =
        localProfile?.phone ||
        studentDetails?.phone ||
        authUser.user_metadata?.phone ||
        authUser.user_metadata?.whatsapp;

      const appUser: AuthUser = {
        id: authUser.id,
        email: authUser.email || '',
        name: displayName,
        phone,
        whatsapp: phone,
        role: isInstructor ? 'INSTRUCTOR' : 'STUDENT',
        isSuperAdmin,
        avatar,
        academicCode: studentDetails?.academic_code,
        academicTrack: studentDetails?.academic_track || 'Secondary & Baccalaureate',
        registeredAt: authUser.created_at,
        title: localProfile?.title || authUser.user_metadata?.title || (isSuperAdmin ? 'Academic Director & Senior Fellow' : isInstructor ? 'Academic Instructor' : undefined),
        bio: localProfile?.bio || authUser.user_metadata?.bio || (isSuperAdmin ? 'PharmD graduate and chemistry educator. Focused on first-principles causality, physical chemistry, reaction mechanisms, and intellectual scientific pedagogy.' : undefined),
        specialization: localProfile?.specialization || authUser.user_metadata?.specialization || (isSuperAdmin ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined),
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

    const handleProfileUpdate = () => {
      fetchUserProfile();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('phenol_user_profile_updated', handleProfileUpdate);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        fetchUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('phenol_user_profile_updated', handleProfileUpdate);
      }
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
