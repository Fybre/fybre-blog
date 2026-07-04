'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';

interface EditorTopBarProps {
  backHref: string;
  backLabel: string;
  children?: ReactNode;
}

export default function EditorTopBar({ backHref, backLabel, children }: EditorTopBarProps) {
  const [siteTitle, setSiteTitle] = useState('Fybre Blog');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((settings) => {
        if (typeof settings?.site_title === 'string' && settings.site_title.trim()) {
          setSiteTitle(settings.site_title);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="truncate font-bold tracking-tight hover:opacity-80 transition-opacity">
            {siteTitle}
          </Link>
          <span className="hidden text-[var(--border)] sm:inline">/</span>
          <Link href={backHref} className="hidden text-sm text-[var(--muted)] hover:text-[var(--fg)] sm:inline">
            {backLabel}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={backHref} className="text-sm text-[var(--muted)] hover:text-[var(--fg)] sm:hidden">
            {backLabel}
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
