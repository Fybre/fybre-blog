'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PostSortMode } from '@/lib/types';

const sortOptions: Array<{ value: PostSortMode; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'A-Z' },
  { value: 'updated', label: 'Recently updated' },
];

export default function PostSortSelect({ currentSort }: { currentSort: PostSortMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const changeSort = (value: PostSortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <label className="inline-flex items-center gap-4 text-sm text-[var(--muted)]">
      <span>Sort</span>
      <select
        value={currentSort}
        onChange={(event) => changeSort(event.target.value as PostSortMode)}
        className="h-9 min-w-44 appearance-none rounded-full border border-[var(--border)] bg-[var(--card)]/70 bg-no-repeat py-0 pl-4 pr-12 text-sm text-[var(--fg)] shadow-sm"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 1.25rem center',
          backgroundSize: '1rem',
        }}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
