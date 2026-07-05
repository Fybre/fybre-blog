import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAttachment, getAttachmentsForPost } from '@/lib/attachments';
import { getPostById } from '@/lib/posts';

const maxAttachmentBytes = 50 * 1024 * 1024;

// Executable/script types are blocked even though attachments are served with
// Content-Disposition: attachment — defense in depth against a browser or
// downstream tool that ignores that header.
const blockedExtensions = new Set([
  '.exe', '.dll', '.so', '.dylib', '.msi', '.com', '.scr', '.bat', '.cmd',
  '.ps1', '.psm1', '.sh', '.bash', '.zsh', '.vbs', '.vbe', '.wsf', '.wsh',
  '.js', '.mjs', '.jar', '.jse', '.app', '.apk', '.php', '.phtml', '.jsp',
  '.html', '.htm', '.svg',
]);

const blockedMimeTypes = new Set([
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
  'text/html',
  'image/svg+xml',
]);

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

  const extension = path.extname(file.name || '').toLowerCase();
  if (blockedExtensions.has(extension) || blockedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: 'This file type is not allowed as an attachment' },
      { status: 400 }
    );
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
