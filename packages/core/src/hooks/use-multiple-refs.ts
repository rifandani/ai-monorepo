import { useRef } from 'react';

/**
 * Iterator function for making the refs object iterable
 * This allows using the refs in a for...of loop or spread operator
 *
 * @returns The iterator object itself
 */
function iterator(this: {
  next: () => void;
  [Symbol.iterator]: () => unknown;
}) {
  return this;
}

/**
 * Hook that creates an iterable collection of refs with the same initial value.
 * Useful when you need multiple refs with the same initialization, like in a list of elements.
 *
 * @template T Type of the ref value
 * @param initialValue Initial value for all created refs
 * @returns An iterable object that creates new refs on each iteration
 *
 * @example
 * ```tsx
 * const refs = useMultipleRefs<HTMLDivElement>(null)
 *
 * // Use in array mapping
 * {items.map((item, i) => {
 *   const [ref] = [...refs]
 *   return <div key={i} ref={ref}>{item}</div>
 * })}
 *
 * // Use in for...of loop
 * for (const ref of refs) {
 *   // Each ref is a new React ref with the initial value
 * }
 * ```
 */
export function useMultipleRefs<T>(initialValue: T) {
  return {
    /**
     * Creates a new ref on each call to next()
     * Required for iterator protocol
     * @returns Object containing the new ref
     */
    next() {
      return {
        done: false,
        // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
        value: useRef(initialValue),
      };
    },
    /**
     * Makes the object iterable by implementing Symbol.iterator
     */
    [Symbol.iterator]: iterator,
  };
}
