import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPost } from '@/lib/posts';

interface PostRequestBody {
  title?: unknown;
  content?: unknown;
  is_public?: unknown;
  tags?: unknown;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as PostRequestBody;
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const post = createPost({
      title: body.title.trim(),
      content: typeof body.content === 'string' ? body.content : '<p></p>',
      is_public: !!body.is_public,
      tags: getTags(body.tags),
    });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to create') }, { status: 500 });
  }
}
