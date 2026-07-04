'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Editor from '@/components/Editor';
import Link from 'next/link';
import { toast } from 'sonner';

interface PostData {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_public: number;
  tags: string[];
}

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/posts/${id}`);
      if (res.ok) {
        const post: PostData & { slug?: string } = await res.json();
        setTitle(post.title);
        setContent(post.content);
        setTags(post.tags.join(', '));
        setIsPublic(!!post.is_public);
        if (post.slug) setSlug(post.slug);
      } else {
        toast.error('Failed to load post');
        router.push('/admin');
      }
      setLoading(false);
    }
    load();
  }, [id, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content,
          is_public: isPublic,
          tags: tagList,
        }),
      });

      if (res.ok) {
        toast.success('Post saved');
        router.refresh();
        // stay on page
      } else {
        toast.error('Save failed');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={slug ? `/posts/${slug}` : '/'} className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
            {slug ? '← Back to post' : '← All posts'}
          </Link>
          <div className="flex gap-2">
            {slug && (
              <Link href={`/posts/${slug}`} className="btn btn-secondary text-sm" target="_blank">
                View live
              </Link>
            )}
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="text-4xl font-semibold tracking-tighter w-full bg-transparent border-none focus:outline-none"
        />

        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Public</span>
          </label>
        </div>

        <div className="mt-6">
          <Editor content={content} onChange={setContent} />
        </div>

        <div className="mt-6">
          <label className="block text-sm mb-1.5 text-[var(--muted)]">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input"
            placeholder="react, design"
          />
        </div>

        <div className="mt-8 text-xs text-[var(--muted)]">
          Last saved will update the post. Changes are immediately live for public posts.
        </div>
      </div>
    </div>
  );
}
