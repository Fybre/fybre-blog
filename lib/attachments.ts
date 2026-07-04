import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { attachmentsDir, db } from './db';
import { Attachment } from './types';

function safeExtension(filename: string) {
  const extension = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return extension.slice(0, 16);
}

export function getAttachmentPath(storedName: string) {
  return path.join(/*turbopackIgnore: true*/ attachmentsDir, path.basename(storedName));
}

export function getAttachmentsForPost(postId: number): Attachment[] {
  return db
    .prepare(
      `SELECT id, post_id, stored_name, original_name, mime_type, size, created_at
       FROM post_attachments
       WHERE post_id = ?
       ORDER BY created_at ASC, id ASC`
    )
    .all(postId) as Attachment[];
}

export function getAttachmentById(id: number): Attachment | null {
  const attachment = db
    .prepare(
      `SELECT id, post_id, stored_name, original_name, mime_type, size, created_at
       FROM post_attachments
       WHERE id = ?`
    )
    .get(id) as Attachment | undefined;

  return attachment ?? null;
}

export function createAttachment(data: {
  postId: number;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}) {
  const storedName = `${crypto.randomBytes(16).toString('hex')}${safeExtension(data.originalName)}`;
  const filepath = getAttachmentPath(storedName);

  fs.writeFileSync(filepath, data.buffer);

  const result = db
    .prepare(
      `INSERT INTO post_attachments (post_id, stored_name, original_name, mime_type, size)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(data.postId, storedName, data.originalName.trim() || 'attachment', data.mimeType || 'application/octet-stream', data.size);

  return getAttachmentById(result.lastInsertRowid as number)!;
}

export function deleteAttachment(id: number) {
  const attachment = getAttachmentById(id);
  if (!attachment) return false;

  db.prepare('DELETE FROM post_attachments WHERE id = ?').run(id);

  const filepath = getAttachmentPath(attachment.stored_name);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  return true;
}

export function deleteAttachmentsForPost(postId: number) {
  const attachments = getAttachmentsForPost(postId);
  db.prepare('DELETE FROM post_attachments WHERE post_id = ?').run(postId);

  for (const attachment of attachments) {
    const filepath = getAttachmentPath(attachment.stored_name);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
