'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { SocialLink } from '@/lib/socialLinks';

export default function SocialLinksEditor({ initialLinks }: { initialLinks: SocialLink[] }) {
  const [links, setLinks] = useState<SocialLink[]>(
    initialLinks.length > 0 ? initialLinks : [{ title: '', url: '' }]
  );

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    setLinks((current) =>
      current.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      )
    );
  };

  const addLink = () => {
    setLinks((current) => [...current, { title: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks((current) => {
      const next = current.filter((_, linkIndex) => linkIndex !== index);
      return next.length > 0 ? next : [{ title: '', url: '' }];
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)]/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-medium">Main page links</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Add any buttons you want shown under the main page intro.
          </p>
        </div>
        <button type="button" onClick={addLink} className="btn btn-secondary shrink-0">
          <Plus size={15} />
          Add link
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {links.map((link, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)]/55 p-3 sm:grid-cols-[0.8fr_1.2fr_auto]">
            <input
              name="link_title"
              value={link.title}
              onChange={(event) => updateLink(index, 'title', event.target.value)}
              className="input"
              placeholder="Button title"
              aria-label="Button title"
            />
            <input
              name="link_url"
              value={link.url}
              onChange={(event) => updateLink(index, 'url', event.target.value)}
              className="input"
              placeholder="https://example.com"
              aria-label="Button URL"
            />
            <button
              type="button"
              onClick={() => removeLink(index)}
              className="btn btn-secondary justify-center sm:px-3"
              aria-label="Remove link"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
