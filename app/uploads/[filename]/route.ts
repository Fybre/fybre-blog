import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { uploadsDir } from '@/lib/db';

const contentTypes: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeFilename = path.basename(filename);
  const extension = path.extname(safeFilename).toLowerCase();
  const contentType = contentTypes[extension];

  if (!contentType || safeFilename !== filename) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filepath = path.join(/*turbopackIgnore: true*/ uploadsDir, safeFilename);
  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const file = fs.readFileSync(filepath);

  return new NextResponse(file, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(file.length),
      'Content-Type': contentType,
    },
  });
}
