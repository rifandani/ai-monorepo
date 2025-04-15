import { useMemoizedFn } from '@workspace/core/hooks/use-memoized-fn';
import { isNumber } from 'radashi';
import { useCallback, useEffect, useRef } from 'react';

/**
 * A hook that provides a declarative way to set up an interval.
 * The interval can be paused by setting delay to null/undefined, and resumed by setting it back to a number.
 *
 * @param fn The callback function to be executed at each interval
 * @param delay The interval duration in milliseconds. Set to null/undefined to pause.
 * @param options Configuration options
 * @param options.immediate Whether to execute the callback immediately on mount/delay change
 * @returns A function to manually clear the interval
 *
 * @example
 * ```ts
 * // Basic interval
 * useInterval(() => {
 *   console.log('Executed every second')
 * }, 1000)
 *
 * // With immediate execution
 * useInterval(() => {
 *   console.log('Executed immediately and then every second')
 * }, 1000, { immediate: true })
 * ```
 */
export function useInterval(
  fn: () => void,
  delay?: number,
  options: { immediate?: boolean } = {}
) {
  /**
   * Memoized version of the callback to maintain referential equality
   */
  const timerCallback = useMemoizedFn(fn);

  /**
   * Reference to store the interval ID for cleanup
   */
  const timerRef = useRef<number | null>(null);

  /**
   * Clears the current interval if it exists
   * @returns void
   */
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Skip setup if delay is invalid
    if (!isNumber(delay) || delay < 0) {
      return;
    }

    // Execute immediately if option is set
    if (options.immediate) {
      timerCallback();
    }

    // Set up the interval
    timerRef.current = setInterval(timerCallback, delay) as unknown as number;

    // Cleanup function to clear interval on unmount or delay change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [delay, options.immediate]);

  return clear;
}
