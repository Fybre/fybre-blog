'use client';

import { useEffect, useState } from 'react';
import type { Typography } from '@/lib/types';

const typographyOptions: {
  value: Typography;
  label: string;
  description: string;
  previewClass: string;
}[] = [
  {
    value: 'system',
    label: 'System',
    description: 'Clean, fast, native-feeling sans',
    previewClass: 'font-sans',
  },
  {
    value: 'editorial',
    label: 'Editorial',
    description: 'Serif headings with calm readable body',
    previewClass: 'font-serif',
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Crisp geometric sans for a polished UI',
    previewClass: 'font-sans',
  },
  {
    value: 'mono',
    label: 'Mono Accent',
    description: 'Sans body with technical mono details',
    previewClass: 'font-mono',
  },
  {
    value: 'classic',
    label: 'Classic',
    description: 'Bookish serif body for longer essays',
    previewClass: 'font-serif',
  },
];

export default function TypographyPicker({ currentTypography }: { currentTypography: Typography }) {
  const [selectedTypography, setSelectedTypography] = useState<Typography>(currentTypography);

  useEffect(() => {
    document.documentElement.dataset.typography = selectedTypography;
  }, [selectedTypography]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {typographyOptions.map((option) => {
        const selected = selectedTypography === option.value;

        return (
          <label
            key={option.value}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              selected
                ? 'border-[var(--accent)] bg-[var(--card)] shadow-[0_16px_50px_rgba(0,0,0,0.12)]'
                : 'border-[var(--border)] bg-[var(--card)]/40 hover:border-[var(--accent)]/50'
            }`}
          >
            <input
              type="radio"
              name="typography"
              value={option.value}
              checked={selected}
              onChange={() => setSelectedTypography(option.value)}
              className="sr-only"
            />
            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
              <div className={`${option.previewClass} text-2xl font-semibold tracking-tight`}>
                Aa Stories
              </div>
              <div className={`${option.previewClass} mt-2 text-sm text-[var(--muted)]`}>
                A quiet sentence for checking rhythm and texture.
              </div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Meta · Code · Tags
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[var(--fg)]">{option.label}</div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">{option.description}</div>
              </div>
              <span
                className={`mt-1 h-3 w-3 rounded-full border ${
                  selected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)]'
                }`}
              />
            </div>
          </label>
        );
      })}
    </div>
  );
}
