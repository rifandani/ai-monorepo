'use client';

import { useDebounce } from '@reactuses/core';
import { parseAsString, useQueryState } from 'nuqs';
import { SearchField } from '@/core/components/ui/search-field';

export function Searchbar() {
  const [query, setQuery] = useQueryState('query', parseAsString);
  const value = useDebounce(query, 1000);

  return (
    <SearchField
      className="mb-2"
      isPending={query !== value}
      onChange={(val) => setQuery(val || null)}
      placeholder="Search for images..."
      value={value ?? ''}
    />
  );
}
