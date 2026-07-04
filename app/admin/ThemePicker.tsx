'use client';

import { useEffect, useState } from 'react';
import { Theme } from '@/lib/types';

const themeOptions: {
  value: Theme;
  label: string;
  description: string;
  colors: string[];
}[] = [
  {
    value: 'system',
    label: 'System',
    description: 'Follows device light or dark mode',
    colors: ['#f7f7f5', '#111111', '#f4f4ec'],
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Clean neutral contrast',
    colors: ['#f7f7f5', '#ffffff', '#171717'],
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'High-contrast night mode',
    colors: ['#050505', '#111111', '#f4f4ec'],
  },
  {
    value: 'midnight',
    label: 'Midnight',
    description: 'Blue-black late-night mode',
    colors: ['#06111f', '#0b1b2e', '#7dd3fc'],
  },
  {
    value: 'evergreen',
    label: 'Evergreen',
    description: 'Dark green low-glare mode',
    colors: ['#07120d', '#0d1f16', '#86efac'],
  },
  {
    value: 'warm',
    label: 'Warm',
    description: 'Paper-like amber tones',
    colors: ['#f7efe4', '#fffaf3', '#9a4f2f'],
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Cool blue editorial feel',
    colors: ['#eef6ff', '#ffffff', '#0369a1'],
  },
];

export default function ThemePicker({ currentTheme }: { currentTheme: Theme }) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = selectedTheme;
  }, [selectedTheme]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {themeOptions.map((theme) => {
        const selected = selectedTheme === theme.value;

        return (
          <label
            key={theme.value}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              selected
                ? 'border-[var(--accent)] bg-[var(--card)] shadow-[0_16px_50px_rgba(0,0,0,0.12)]'
                : 'border-[var(--border)] bg-[var(--card)]/40 hover:border-[var(--accent)]/50'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={theme.value}
              checked={selected}
              onChange={() => setSelectedTheme(theme.value)}
              className="sr-only"
            />
            <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
              <div style={{ background: theme.colors[0] }} className="p-3">
                <div style={{ background: theme.colors[1] }} className="rounded-lg p-3">
                  <div style={{ background: theme.colors[2] }} className="mb-2 h-2 w-20 rounded-full" />
                  <div style={{ background: theme.colors[2], opacity: 0.45 }} className="h-2 w-28 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[var(--fg)]">{theme.label}</div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">{theme.description}</div>
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
