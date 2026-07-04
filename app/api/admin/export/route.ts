import { NextResponse } from 'next/server';
import { getPostsForExport } from '@/lib/posts';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { uploadsDir } from '@/lib/db';
import JSZip from 'jszip';
import TurndownService from 'turndown';

const safeFilename = (value: string, fallback: string) =>
  (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || fallback;

const escapeFrontmatterString = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = getPostsForExport();
  const zip = new JSZip();
  const turndown = new TurndownService({
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
  });
  const postsFolder = zip.folder('posts');
  const uploadsFolder = zip.folder('uploads');

  turndown.addRule('localUploads', {
    filter: (node) => node.nodeName === 'IMG' && Boolean(node.getAttribute('src')?.startsWith('/uploads/')),
    replacement: (_content, node) => {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      return `![${alt}](../uploads/${src.replace('/uploads/', '')})`;
    },
  });

  // Collect all referenced uploads and read them
  const seen = new Set<string>();

  const imgRegex = /src=["']\/uploads\/([^"']+)["']/g;

  for (const post of posts) {
    let match;
    while ((match = imgRegex.exec(post.content)) !== null) {
      const filename = match[1];
      if (seen.has(filename)) continue;
      seen.add(filename);

      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) {
        const buf = fs.readFileSync(filepath);
        uploadsFolder?.file(filename, buf);
      }
    }

    const markdown = [
      '---',
      `title: "${escapeFrontmatterString(post.title)}"`,
      `date: ${post.created_at}`,
      `tags: [${post.tags.map((tag) => `"${escapeFrontmatterString(tag)}"`).join(', ')}]`,
      `visibility: ${post.is_public ? 'public' : 'private'}`,
      '---',
      '',
      turndown.turndown(post.content),
    ].join('\n');

    postsFolder?.file(`${safeFilename(post.slug, `post-${post.id}`)}.md`, markdown);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filename = `fybre-blog-export-${new Date().toISOString().slice(0, 10)}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/zip',
    },
  });
}
