'use client';

import { SearchField } from '@/core/components/ui/search-field';
import { useDebounce } from '@reactuses/core';
import { parseAsString, useQueryState } from 'nuqs';

export function Searchbar() {
  const [query, setQuery] = useQueryState('query', parseAsString);
  const value = useDebounce(query, 1_000);

  return (
    <SearchField
      isPending={query !== value}
      value={value ?? ''}
      onChange={(val) => setQuery(val || null)}
      className="mb-2"
      placeholder="Search for images..."
    />
  );
}
