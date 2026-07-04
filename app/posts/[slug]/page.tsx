import type { Metadata } from 'next';
import Header from '@/components/Header';
import { getPostBySlug } from '@/lib/posts';
import { formatDate, getExcerpt, getReadingTime } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSetting } from '@/lib/db';
import { highlightCodeHtml } from '@/lib/codeHighlight';

const escapeAttribute = (value: string) => value.replace(/"/g, '&quot;');

function enhanceCodeBlocks(html: string) {
  return html.replace(
    /<pre([^>]*)><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g,
    (_match, preAttributes: string, language: string, codeHtml: string) =>
      `<pre${preAttributes} data-language="${escapeAttribute(language)}"><code class="language-${escapeAttribute(language)} hljs">${highlightCodeHtml(language, codeHtml)}</code></pre>`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, false);
  const siteTitle = getSetting('site_title') || 'Fybre Blog';

  if (!post) {
    return {
      title: siteTitle,
    };
  }

  const description = getExcerpt(post.content, 155);

  return {
    title: `${post.title} | ${siteTitle}`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      tags: post.tags,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  const post = getPostBySlug(slug, !!session); // allow private if logged in

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="w-full max-w-3xl mx-auto px-6 py-10">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
              ← All posts
            </Link>

            {!post.is_public && session && (
              <div className="inline-block text-xs px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded">PRIVATE — visible because you are logged in</div>
            )}
          </div>

          <article className="mt-6 w-full rounded-3xl border border-[var(--border)] bg-[var(--card)]/60 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.08)] md:p-10">
            <header className="mb-8">
              <h1 className="text-4xl font-semibold tracking-tighter">{post.title}</h1>
              <div className="flex items-center gap-3 mt-3 text-sm text-[var(--muted)]">
                <time>{formatDate(post.created_at)}</time>
                <span>•</span>
                <span>{getReadingTime(post.content)}</span>
                {post.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex gap-2">
                      {post.tags.map((tag) => (
                        <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="tag hover:underline">
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </header>

            <div 
              className="prose" 
              dangerouslySetInnerHTML={{ __html: enhanceCodeBlocks(post.content) }} 
            />
          </article>

          {session && (
            <div className="mt-10 text-xs">
              <Link href={`/admin/edit/${post.id}`} className="text-[var(--link)]">Edit this post →</Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
