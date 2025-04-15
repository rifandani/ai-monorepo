import { isFunction } from 'radashi';
import { useEffect } from 'react';

/**
 * A hook that executes a function after the component is mounted.
 */
export function useMount(fn: () => void) {
  if (!isFunction(fn)) {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error(
      `useMount: parameter \`fn\` expected to be a function, but got "${typeof fn}".`
    );
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fn();
  }, []);
}
