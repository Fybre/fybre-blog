'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LayoutGrid, List, Rows3 } from 'lucide-react';
import { PostViewMode } from '@/lib/types';

const options: Array<{
  value: PostViewMode;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'column', label: 'Column', icon: Rows3 },
  { value: 'list', label: 'List', icon: List },
];

export default function PostViewModePicker({ currentMode }: { currentMode: PostViewMode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setMode = async (mode: PostViewMode) => {
    await fetch('/api/preferences/post-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    startTransition(() => router.refresh());
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)]/70 p-1 shadow-sm">
      {options.map((option) => {
        const selected = currentMode === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            disabled={pending}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selected
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--fg)]/5 hover:text-[var(--fg)]'
            }`}
            aria-pressed={selected}
            title={`Show posts as ${option.label.toLowerCase()}`}
          >
            <Icon size={14} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
