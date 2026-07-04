import { getSetting } from '@/lib/db';
import { getAllPosts } from '@/lib/posts';
import { getExcerpt } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET(request: Request) {
  const siteTitle = getSetting('site_title') || 'Fybre Blog';
  const siteDescription = getSetting('hero_subtitle') || 'A simple, modern blog';
  const origin = new URL(request.url).origin;
  const posts = getAllPosts(false, 'newest');

  const items = posts
    .map((post) => {
      const url = `${origin}/posts/${post.slug}`;
      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid>${escapeXml(url)}</guid>
          <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
          <description>${escapeXml(getExcerpt(post.content, 300))}</description>
        </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(siteTitle)}</title>
        <link>${escapeXml(origin)}</link>
        <description>${escapeXml(siteDescription)}</description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
