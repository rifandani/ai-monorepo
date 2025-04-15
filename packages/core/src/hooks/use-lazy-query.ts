import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * the lazy version of `useQuery`
 */
export function useLazyQuery<TData, TError>(
  options: Omit<UseQueryOptions<TData, TError>, 'enabled'>
) {
  const [enabled, setEnabled] = useState(false);

  const query = useQuery<TData, TError>({
    ...options,
    enabled,
  });

  const trigger = useCallback(() => {
    if (!enabled) {
      setEnabled(true);
    }
  }, [enabled]);

  return [trigger, query] as const;
}
