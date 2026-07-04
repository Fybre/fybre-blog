import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteAttachment, getAttachmentById } from '@/lib/attachments';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const attachmentId = parseInt(id, 10);
  const attachment = getAttachmentById(attachmentId);
  if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });

  deleteAttachment(attachmentId);
  return NextResponse.json({ success: true });
}
