/**
 * PHENOL ACADEMY - Student Academic Forensic Code System
 * Generates and manages stealth watermarking codes for lecture security.
 */

import { AuthUser } from '@/types/auth';

export const getStudentAcademicCode = (user?: AuthUser | null): string => {
  if (!user) return 'PH-GUEST-00';
  if (user.role === 'INSTRUCTOR' || user.email?.includes('phenolvii')) {
    return 'DIR-OMAR-01';
  }
  if (user.academicCode) {
    return user.academicCode;
  }

  // Generate deterministic 4-digit code based on email or id
  const seed = (user.email || user.id || 'student').toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = Math.abs(hash % 9000) + 1000;
  const initial = (user.name ? user.name.trim()[0] : 'S').toUpperCase();
  return `PH-${codeNum}-${initial}`;
};

export const parseVideoSource = (url?: string): {
  type: 'youtube' | 'vimeo' | 'direct' | 'none';
  videoId?: string;
  embedUrl?: string;
} => {
  if (!url || !url.trim()) {
    return { type: 'none' };
  }

  const clean = url.trim();

  // YouTube matchers:
  // e.g. https://www.youtube.com/watch?v=k3rRrl9J2F4
  // e.g. https://youtu.be/k3rRrl9J2F4
  // e.g. https://www.youtube.com/embed/k3rRrl9J2F4
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      videoId: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?enablejsapi=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=1`,
    };
  }

  // Vimeo matchers
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      videoId: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`,
    };
  }

  // Direct MP4 / WebM / CDN
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.includes('/stream/')) {
    return {
      type: 'direct',
      embedUrl: clean,
    };
  }

  // Fallback to youtube if ID was passed directly (11 chars)
  if (/^[\w-]{11}$/.test(clean)) {
    return {
      type: 'youtube',
      videoId: clean,
      embedUrl: `https://www.youtube-nocookie.com/embed/${clean}?enablejsapi=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=1`,
    };
  }

  return {
    type: 'direct',
    embedUrl: clean,
  };
};
