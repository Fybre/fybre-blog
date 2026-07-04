import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPostById, updatePost, deletePost } from '@/lib/posts';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const post = getPostById(parseInt(id, 10));
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as PostRequestBody;

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const updated = updatePost(parseInt(id, 10), {
      title: body.title.trim(),
      content: typeof body.content === 'string' ? body.content : '<p></p>',
      is_public: !!body.is_public,
      tags: getTags(body.tags),
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to update') }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  deletePost(parseInt(id, 10));
  return NextResponse.json({ success: true });
}
