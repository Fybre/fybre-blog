import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAttachment, getAttachmentsForPost } from '@/lib/attachments';
import { getPostById } from '@/lib/posts';

const maxAttachmentBytes = 50 * 1024 * 1024;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const postId = parseInt(id, 10);
  const post = getPostById(postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  return NextResponse.json({ attachments: getAttachmentsForPost(postId) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const postId = parseInt(id, 10);
  const post = getPostById(postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a file to attach' }, { status: 400 });
  }

  if (file.size > maxAttachmentBytes) {
    return NextResponse.json({ error: 'Attachment must be 50 MB or smaller' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const attachment = createAttachment({
    postId,
    originalName: file.name || 'attachment',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    buffer,
  });

  return NextResponse.json(attachment);
}
