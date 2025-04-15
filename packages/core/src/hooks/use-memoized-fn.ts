import { isFunction } from 'radashi';
import { useMemo, useRef } from 'react';

// biome-ignore lint/suspicious/noExplicitAny: intended
type noop = (this: any, ...args: any[]) => any;

type PickFunction<T extends noop> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>;

/**
 * Hooks for persistent functions.
 * In general, `useMemoizedFn` can be used instead of useCallback.
 *
 * In some scenarios, we need to use `useCallback` to cache a function,
 * but when the second parameter deps changes, the function will be regenerated,
 * causing the function reference to change.
 *
 * Using `useMemoizedFn`, you can omit the second parameter deps,
 * and ensure that the function reference never change.
 */
export function useMemoizedFn<T extends noop>(fn: T) {
  if (!isFunction(fn)) {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error(
      `useMemoizedFn expected parameter is a function, got ${typeof fn}`
    );
  }

  const fnRef = useRef<T>(fn);

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef<PickFunction<T>>(null);
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}
