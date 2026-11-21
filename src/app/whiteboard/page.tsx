'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { ChemistryCourse } from '@/types/lms';
import { SmartWhiteboard } from '@/components/whiteboard/SmartWhiteboard';

export default function WhiteboardPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [courses, setCourses] = useState<ChemistryCourse[]>(() => getStoredCourses());

  const isAllowed =
    user?.role === 'INSTRUCTOR' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.isSuperAdmin === true;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?redirect=/whiteboard');
      return;
    }
    if (!isAllowed) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, isAllowed, router]);

  useEffect(() => {
    syncWithServerCourses().then((list) => {
      if (Array.isArray(list) && list.length > 0) setCourses(list);
    });
  }, []);

  const courseOptions = useMemo(() => {
    if (!user) return [];
    const email = (user.email || '').toLowerCase();
    const isSuper = user.role === 'SUPER_ADMIN' || user.isSuperAdmin;
    const mine = isSuper
      ? courses
      : courses.filter((c) => (c.instructorEmail || '').toLowerCase() === email);
    return mine.map((c) => c.title).filter(Boolean);
  }, [courses, user]);

  if (isLoading || !user || !isAllowed) {
    return (
      <div className="min-h-screen bg-ivory-200 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-9 h-9 rounded-full border-2 border-burgundy-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-charcoal-100">Opening Whiteboard...</p>
      </div>
    );
  }

  return (
    <SmartWhiteboard
      defaultInstructorName={user.name || 'Dr. Omar Magdi'}
      courseOptions={courseOptions}
      backHref="/dashboard"
    />
  );
}
