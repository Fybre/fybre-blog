'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@/components/Editor';
import { toast } from 'sonner';
import AIAssistControls from '@/components/AIAssistControls';
import EditorTopBar from '@/components/EditorTopBar';

export default function NewPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultLoaded, setDefaultLoaded] = useState(false);

  // Load default visibility from server
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : { default_visibility: 'public' })
      .then(data => {
        setIsPublic(data.default_visibility !== 'private');
        setDefaultLoaded(true);
      })
      .catch(() => setDefaultLoaded(true));
  }, []);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    setSaving(true);

    const tagList = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content,
          is_public: isPublic,
          tags: tagList,
        }),
      });

      if (res.ok) {
        const post = await res.json();
        toast.success(isPublic ? 'Public post saved' : 'Private post saved');
        router.push(`/admin/edit/${post.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <EditorTopBar backHref="/" backLabel="← All posts">
        <button
          onClick={handleSave}
          disabled={saving || !defaultLoaded}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </EditorTopBar>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="text-4xl font-semibold tracking-tighter w-full bg-transparent border-none focus:outline-none placeholder:text-[var(--muted)]"
        />

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Public</span>
          </label>
          <div className="text-xs text-[var(--muted)]">
            New posts default to {isPublic ? 'public' : 'private'} based on admin settings. Toggle before saving if needed.
          </div>
          {!defaultLoaded && (
            <div className="text-xs text-[var(--muted)]">Loading defaults...</div>
          )}
        </div>

        <div className="mt-6">
          <Editor content={content} onChange={setContent} />
        </div>

        <div className="mt-6">
          <AIAssistControls
            title={title}
            content={content}
            tags={tags}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onTagsChange={setTags}
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm mb-1.5 text-[var(--muted)]">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="nextjs, design, thoughts"
            className="input"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/45 p-4 text-sm text-[var(--muted)]">
          Attachments can be added after the first save.
        </div>
      </div>
    </div>
  );
}
