import Header from '@/components/Header';
import { getAllPosts, getAllTags, searchPosts } from '@/lib/posts';
import { getSession, hasUsers } from '@/lib/auth';
import { getSetting } from '@/lib/db';
import { PostSortMode, PostViewMode } from '@/lib/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PostViewModePicker from '@/components/PostViewModePicker';
import PostSortSelect from '@/components/PostSortSelect';
import { getSocialLinks } from '@/lib/socialLinks';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { formatDate, getExcerpt, getReadingTime } from '@/lib/utils';
import { Lock, Pencil, Trash2, Search, X } from 'lucide-react';
import DeleteButton from './admin/DeleteButton';

interface SearchParams {
  q?: string;
  tag?: string;
  sort?: string;
}

const postViewModes: PostViewMode[] = ['grid', 'column', 'list'];
const postSortModes: PostSortMode[] = ['newest', 'oldest', 'title', 'updated'];

function getPostViewMode(value: string | undefined): PostViewMode {
  return postViewModes.includes(value as PostViewMode) ? (value as PostViewMode) : 'grid';
}

function getPostSortMode(value: string | undefined): PostSortMode {
  return postSortModes.includes(value as PostSortMode) ? (value as PostSortMode) : 'newest';
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const clean = query.trim();
  if (!clean) return text;

  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === clean.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded bg-amber-300/35 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await hasUsers())) {
    redirect('/setup');
  }

  const params = await searchParams;
  const q = params.q || '';
  const activeTag = params.tag || '';
  const sort = getPostSortMode(params.sort);
  const session = await getSession();
  const cookieStore = await cookies();
  const postViewMode = getPostViewMode(cookieStore.get('fybre_post_view')?.value);
  const includePrivate = !!session;

  const posts = (q || activeTag)
    ? searchPosts(q, activeTag, includePrivate, sort)
    : getAllPosts(includePrivate, sort);

  const allTags = getAllTags();
  const heroTitle = getSetting('hero_title') || 'The Notebook';
  const heroSubtitle = getSetting('hero_subtitle') || 'Thoughts, notes, and stories exploring technology, design, and life.';
  const newPostButtonText = getSetting('new_post_button_text') || 'Write a story';
  const socialLinks = getSocialLinks();
  const searchSummary = q
    ? `Search results for “${q}”`
    : activeTag
      ? `Posts tagged “${activeTag}”`
      : '';
  const clearSearchHref = activeTag ? `/?tag=${encodeURIComponent(activeTag)}` : '/';
  const isListMode = postViewMode === 'list';
  const postsLayoutClass = {
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8',
    column: 'grid grid-cols-1 gap-6',
    list: 'grid grid-cols-1 gap-2',
  }[postViewMode];
  const postCardClass = 'post-card group relative bg-[var(--card)]/60 border border-[var(--border)] p-6 md:p-8 rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.06)] hover:border-[var(--accent)] hover:shadow-[0_24px_80px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col';

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 w-full animate-fade-in">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-[var(--fg)] to-[var(--muted)] bg-clip-text text-transparent pb-2">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] max-w-lg mb-8 font-medium">
            {heroSubtitle}
          </p>
          {socialLinks.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {socialLinks.map((link) => (
                <a key={`${link.title}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="tag hover:-translate-y-0.5">
                  {link.title}
                </a>
              ))}
            </div>
          )}
          
          {session && (
            <Link href="/admin/new" className="btn btn-primary animate-float shadow-2xl">
              <Pencil size={16} />
              {newPostButtonText}
            </Link>
          )}
        </div>

        {/* Search + Filters */}
        <div className="max-w-2xl mx-auto mb-16 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <form className="search-form" action="/" method="GET">
            <div className="search-icon">
              <Search size={18} />
            </div>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search through posts..."
              className="input search-input shadow-sm"
            />
            {q && (
              <Link href={clearSearchHref} className="search-clear" aria-label="Clear search">
                <X size={16} />
              </Link>
            )}
          </form>

          {searchSummary && (
            <div className="flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
              <span>{searchSummary}</span>
              <Link href="/" className="font-medium text-[var(--fg)] hover:underline">
                Clear all
              </Link>
            </div>
          )}

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center justify-center pt-2">
              {allTags.map((tag) => {
                const isActive = activeTag === tag;
                const href = isActive 
                  ? '/' 
                  : `/?tag=${encodeURIComponent(tag)}`;
                return (
                  <Link
                    key={tag}
                    href={href}
                    className={`tag ${isActive ? 'bg-[var(--fg)] text-[var(--bg)] border-transparent shadow-md' : 'hover:-translate-y-0.5'}`}
                  >
                    {tag}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Grid */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {posts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-3xl bg-[var(--card)]/50">
              <div className="w-12 h-12 bg-[var(--bg)] rounded-full flex items-center justify-center text-[var(--muted)] mb-4 shadow-sm">
                <Search size={20} />
              </div>
              <h3 className="text-lg font-semibold">{q || activeTag ? 'No posts found' : 'It’s quiet here'}</h3>
              <p className="text-[var(--muted)] mt-1">{q || activeTag ? 'Try adjusting your search or filters.' : 'Check back later for new stories.'}</p>
              {session && !q && !activeTag && (
                <Link href="/admin/new" className="btn btn-primary mt-6">
                  <Pencil size={16} />
                  {newPostButtonText}
                </Link>
              )}
              {(q || activeTag) && (
                <Link href="/" className="btn btn-secondary mt-6">
                  Clear search
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--muted)]">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <PostSortSelect currentSort={sort} />
                  <PostViewModePicker currentMode={postViewMode} />
                </div>
              </div>

              <div className={postsLayoutClass}>
              {posts.map((post) => (
                isListMode ? (
                  <div
                    key={post.id}
                    className="post-card group relative rounded-2xl border border-[var(--border)] bg-[var(--card)]/55 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)]"
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className="post-card-link grid gap-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-4 rounded-xl md:grid-cols-[8.5rem_minmax(10rem,1.1fr)_6.5rem_minmax(12rem,1.4fr)] md:items-center"
                    >
                      <time className="whitespace-nowrap text-[var(--muted)]">
                        {formatDate(post.created_at)}
                      </time>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-semibold text-[var(--fg)] group-hover:text-[var(--accent)]">
                          <HighlightedText text={post.title} query={q} />
                        </span>
                        {!post.is_public && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                            <Lock size={10} />
                            Private
                          </span>
                        )}
                      </div>
                      <span className="whitespace-nowrap text-[var(--muted)]">{getReadingTime(post.content)}</span>
                      <span className="truncate text-[var(--muted)]">
                        <HighlightedText text={getExcerpt(post.content, 120)} query={q} />
                      </span>
                    </Link>

                    {session && (
                      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--glass)] p-1 opacity-0 shadow-sm backdrop-blur-md transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/admin/edit/${post.id}`}
                          className="p-2 rounded-md hover:bg-[var(--fg)]/10 text-[var(--fg)] transition-colors"
                          aria-label="Edit post"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <DeleteButton
                          postId={post.id}
                          redirectTo="/"
                          className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors"
                          aria-label="Delete post"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </DeleteButton>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    key={post.id}
                    className={postCardClass}
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className="post-card-link flex-1 block focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-4 rounded-xl"
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="h-1 w-6 bg-[var(--border)] rounded-full group-hover:bg-[var(--accent)] transition-colors" />
                        <time className="text-sm font-medium text-[var(--muted)]">
                          {formatDate(post.created_at)}
                        </time>
                        <span className="text-sm text-[var(--muted)]">•</span>
                        <span className="text-sm text-[var(--muted)]">{getReadingTime(post.content)}</span>
                        {!post.is_public && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                            <Lock size={11} />
                            Private
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-2xl font-bold tracking-tight mb-3 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                      <HighlightedText text={post.title} query={q} />
                      </h2>
                      
                      <p className="text-[var(--muted)] leading-relaxed line-clamp-3 mb-6">
                      <HighlightedText text={getExcerpt(post.content)} query={q} />
                      </p>

                      {post.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-auto">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-xs font-medium text-[var(--muted)] bg-[var(--bg)] px-2.5 py-1 rounded-md border border-[var(--border)] group-hover:border-transparent transition-colors">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>

                    {session && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--glass)] backdrop-blur-md rounded-lg border border-[var(--border)] p-1 shadow-sm translate-y-2 group-hover:translate-y-0">
                        <Link
                          href={`/admin/edit/${post.id}`}
                          className="p-2 rounded-md hover:bg-[var(--fg)]/10 text-[var(--fg)] transition-colors"
                          aria-label="Edit post"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <DeleteButton
                          postId={post.id}
                          redirectTo="/"
                          className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors"
                          aria-label="Delete post"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </DeleteButton>
                      </div>
                    )}
                  </div>
                )
              ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
