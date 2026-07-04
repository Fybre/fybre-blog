import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAttachmentById, getAttachmentPath } from '@/lib/attachments';
import { getPostById } from '@/lib/posts';

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '\\"');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attachment = getAttachmentById(parseInt(id, 10));
  if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });

  const post = getPostById(attachment.post_id);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  if (!post.is_public) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filepath = getAttachmentPath(attachment.stored_name);
  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const file = fs.readFileSync(filepath);

  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Disposition': contentDisposition(attachment.original_name),
      'Content-Length': String(attachment.size),
      'Content-Type': attachment.mime_type || 'application/octet-stream',
    },
  });
}
