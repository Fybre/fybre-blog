'use client';

import { useEffect, useRef, useState } from 'react';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function splitTags(value: string) {
  return value.split(',');
}

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/tags')
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((data) => setAllTags(data.tags || []))
      .catch(() => setAllTags([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const segments = splitTags(value);
  const currentSegment = segments[segments.length - 1].trim().toLowerCase();
  const usedTags = new Set(
    segments.slice(0, -1).map((t) => t.trim().toLowerCase()).filter(Boolean)
  );

  const suggestions = currentSegment
    ? allTags
        .filter(
          (tag) =>
            tag.toLowerCase().includes(currentSegment) &&
            tag.toLowerCase() !== currentSegment &&
            !usedTags.has(tag.toLowerCase())
        )
        .slice(0, 8)
    : [];

  const applySuggestion = (tag: string) => {
    const newSegments = [...segments.slice(0, -1), ` ${tag}`];
    onChange(newSegments.join(',').replace(/^ /, '') + ', ');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            applySuggestion(suggestions[activeIndex]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
          {suggestions.map((tag, index) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySuggestion(tag)}
                className={`w-full px-3 py-1.5 text-left text-sm ${
                  index === activeIndex ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : ''
                }`}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
