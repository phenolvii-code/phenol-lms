import { NextResponse } from 'next/server';
import { TimelinePost } from '@/types/lms';

// In-memory server store for dynamic timeline posts
let globalPosts: TimelinePost[] = [];
let deletedPostIds: string[] = ['post-1', 'post-2']; // Default purge of legacy mock posts

export async function GET() {
  const cleanPosts = globalPosts.filter((p) => !deletedPostIds.includes(p.id));
  return NextResponse.json({
    posts: cleanPosts,
    deletedIds: deletedPostIds,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { posts, deletedId } = body;

    if (deletedId && typeof deletedId === 'string') {
      if (!deletedPostIds.includes(deletedId)) {
        deletedPostIds.push(deletedId);
      }
      globalPosts = globalPosts.filter((p) => p.id !== deletedId);
    }

    if (Array.isArray(posts)) {
      globalPosts = posts.filter((p) => !deletedPostIds.includes(p.id));
    }

    return NextResponse.json({
      success: true,
      posts: globalPosts,
      deletedIds: deletedPostIds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
