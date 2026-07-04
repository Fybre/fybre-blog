'use client';

import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Attachment } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

export default function AttachmentManager({ postId }: { postId: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadAttachments = async () => {
    const res = await fetch(`/api/admin/posts/${postId}/attachments`);
    if (!res.ok) {
      toast.error('Failed to load attachments');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as { attachments: Attachment[] };
    setAttachments(data.attachments);
    setLoading(false);
  };

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/posts/${postId}/attachments`);
      if (!res.ok) {
        toast.error('Failed to load attachments');
        setLoading(false);
        return;
      }

      const data = (await res.json()) as { attachments: Attachment[] };
      setAttachments(data.attachments);
      setLoading(false);
    }

    load();
  }, [postId]);

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/admin/posts/${postId}/attachments`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}`);
      }

      toast.success(files.length === 1 ? 'Attachment uploaded' : `${files.length} attachments uploaded`);
      await loadAttachments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Attachment upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const deleteFile = async (attachment: Attachment) => {
    if (!window.confirm(`Remove attachment “${attachment.original_name}”?`)) return;

    const res = await fetch(`/api/admin/attachments/${attachment.id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      toast.error('Failed to remove attachment');
      return;
    }

    setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    toast.success('Attachment removed');
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/55 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <Paperclip size={16} />
            Attachments
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Files are shown on the post and follow the post&apos;s public/private visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-secondary shrink-0"
        >
          <Upload size={15} />
          {uploading ? 'Uploading...' : 'Add files'}
        </button>
        <input ref={inputRef} type="file" multiple onChange={uploadFiles} className="hidden" />
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading attachments...</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No attachments yet.</p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{attachment.original_name}</div>
                <div className="text-xs text-[var(--muted)]">{formatBytes(attachment.size)}</div>
              </div>
              <div className="flex gap-2">
                <a href={`/api/attachments/${attachment.id}`} className="btn btn-secondary px-3" title="Download attachment">
                  <Download size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => deleteFile(attachment)}
                  className="btn btn-secondary px-3"
                  title="Remove attachment"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
