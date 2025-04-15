import { useMemoizedFn } from '@workspace/core/hooks/use-memoized-fn';
import { isNumber } from 'radashi';
import { useCallback, useEffect, useRef } from 'react';

/**
 * A hook that handles the setTimeout timer function.
 *
 * @example
 *
 * const clear = useTimeout(() => {
 *   setCount(count + 1);
 * }, delay);
 */
export function useTimeout(fn: () => void, delay?: number) {
  const timerCallback = useMemoizedFn(fn);
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isNumber(delay) || delay < 0) {
      return;
    }

    timerRef.current = setTimeout(timerCallback, delay) as unknown as number;

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [delay]);

  return clear;
}
