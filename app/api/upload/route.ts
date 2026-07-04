import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { uploadsDir } from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

const imageExtensions: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

function extensionFor(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  return imageExtensions[file.type] || extension;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.size) {
      return NextResponse.json({ error: 'Image is empty' }, { status: 400 });
    }

    if (!imageExtensions[file.type]) {
      return NextResponse.json({ error: 'Only PNG, JPG, GIF, WebP, and SVG images are supported' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = extensionFor(file);

    // Generate unique filename
    const filename = `${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(/*turbopackIgnore: true*/ uploadsDir, filename);

    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (e) {
    console.error('Upload error', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
