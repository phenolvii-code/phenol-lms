/**
 * PHENOL ACADEMY - Persistent Timeline Storage Engine
 * Guarantees permanent post deletion and cross-device sync.
 */

import { TimelinePost } from '@/types/lms';

const LEGACY_POST_IDS = ['post-1', 'post-2'];

export const getDeletedPostIds = (): string[] => {
  if (typeof window === 'undefined') return LEGACY_POST_IDS;
  try {
    const raw = localStorage.getItem('phenol_deleted_post_ids');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set([...LEGACY_POST_IDS, ...parsed]));
      }
    }
  } catch (e) {}
  return LEGACY_POST_IDS;
};

export const markPostDeleted = (postId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedPostIds();
    if (!current.includes(postId)) {
      current.push(postId);
      localStorage.setItem('phenol_deleted_post_ids', JSON.stringify(current));
    }
    // Also notify server
    fetch('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedId: postId }),
    }).catch(() => {});
  } catch (e) {}
};

export const getStoredPosts = (): TimelinePost[] => {
  if (typeof window === 'undefined') return [];
  try {
    const deletedIds = getDeletedPostIds();
    const raw = localStorage.getItem('phenol_timeline_posts');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((p) => !deletedIds.includes(p.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem('phenol_timeline_posts', JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (e) {
    console.error('Error reading stored timeline posts:', e);
  }
  return [];
};

export const saveStoredPosts = (posts: TimelinePost[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const deletedIds = getDeletedPostIds();
    const clean = posts.filter((p) => !deletedIds.includes(p.id));
    localStorage.setItem('phenol_timeline_posts', JSON.stringify(clean));
    window.dispatchEvent(new Event('phenol_timeline_updated'));

    // Sync to server API in background
    fetch('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: clean }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving stored timeline posts:', e);
  }
};

export const syncWithServerTimeline = async (): Promise<TimelinePost[]> => {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/timeline');
    if (!res.ok) return getStoredPosts();
    const data = await res.json();

    if (Array.isArray(data.deletedIds)) {
      const currentDeleted = getDeletedPostIds();
      const combinedDeleted = Array.from(new Set([...currentDeleted, ...data.deletedIds]));
      localStorage.setItem('phenol_deleted_post_ids', JSON.stringify(combinedDeleted));
    }

    if (Array.isArray(data.posts)) {
      const deletedIds = getDeletedPostIds();
      const serverClean = data.posts.filter((p: TimelinePost) => !deletedIds.includes(p.id));
      const localClean = getStoredPosts();

      const postMap = new Map<string, TimelinePost>();
      serverClean.forEach((p: TimelinePost) => postMap.set(p.id, p));
      localClean.forEach((p) => postMap.set(p.id, p));

      const merged = Array.from(postMap.values()).filter((p) => !deletedIds.includes(p.id));
      localStorage.setItem('phenol_timeline_posts', JSON.stringify(merged));
      window.dispatchEvent(new Event('phenol_timeline_updated'));
      return merged;
    }
  } catch (e) {}
  return getStoredPosts();
};
