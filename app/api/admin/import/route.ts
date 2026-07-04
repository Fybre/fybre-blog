import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { marked } from 'marked';
import { getSession } from '@/lib/auth';
import { uploadsDir } from '@/lib/db';
import { createPost } from '@/lib/posts';

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  const frontmatter = match?.[1] || '';
  const body = match ? markdown.slice(match[0].length) : markdown;
  const data: Record<string, string> = {};

  for (const line of frontmatter.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value.replace(/^"|"$/g, '').replace(/\\"/g, '"');
  }

  return { data, body };
}

function parseTags(value: string | undefined) {
  if (!value) return [];
  return value
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((tag) => tag.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

function titleFromFilename(filename: string) {
  return filename
    .split('/')
    .pop()!
    .replace(/\.md$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function importMarkdown(filename: string, markdown: string) {
  const { data, body } = parseFrontmatter(markdown);
  const normalizedBody = body.replace(/\]\(\.\.\/uploads\//g, '](/uploads/');
  const html = await marked.parse(normalizedBody, { async: false });
  const post = createPost({
    title: data.title || titleFromFilename(filename),
    content: typeof html === 'string' ? html : String(html),
    is_public: data.visibility ? data.visibility !== 'private' : true,
    tags: parseTags(data.tags),
  });
  return post;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a Markdown or ZIP file' }, { status: 400 });
  }

  const imported = [];
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.toLowerCase().endsWith('.zip')) {
    const zip = await JSZip.loadAsync(buffer);
    const uploadFiles = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.startsWith('uploads/'));
    const markdownFiles = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.md'));

    for (const entry of uploadFiles) {
      const filename = path.basename(entry.name);
      if (!filename) continue;
      const uploadBuffer = await entry.async('nodebuffer');
      fs.writeFileSync(path.join(uploadsDir, filename), uploadBuffer);
    }

    for (const entry of markdownFiles) {
      const markdown = await entry.async('string');
      imported.push(await importMarkdown(entry.name, markdown));
    }
  } else if (file.name.toLowerCase().endsWith('.md')) {
    imported.push(await importMarkdown(file.name, buffer.toString('utf8')));
  } else {
    return NextResponse.json({ error: 'Only .md and .zip files are supported' }, { status: 400 });
  }

  return NextResponse.json({ imported: imported.length, posts: imported });
}
