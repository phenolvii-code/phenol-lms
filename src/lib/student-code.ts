/**
 * PHENOL ACADEMY - Video Source Parser & Academic Code Reader
 * Reads DB-generated academic codes and parses video sources.
 */

export const getStudentAcademicCode = (user?: { academicCode?: string } | null | any): string => {
  return user?.academicCode || 'PH-SCHOLAR';
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
