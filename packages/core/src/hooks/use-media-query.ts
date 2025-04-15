import React from 'react';

/**
 * Easily retrieve media dimensions with this Hook React which also works onResize.
 *
 * @example
 *
 * ```ts
 * const matches = useMediaQuery('(min-width: 768px)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = React.useCallback((_query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(_query).matches;
    }

    return false;
  }, []);

  const [matches, setMatches] = React.useState<boolean>(getMatches(query));

  const handleChange = React.useCallback(() => {
    setMatches(getMatches(query));
  }, [query, getMatches]);

  React.useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener('change', handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener('change', handleChange);
      }
    };
  }, [query, handleChange]);

  return matches;
}
