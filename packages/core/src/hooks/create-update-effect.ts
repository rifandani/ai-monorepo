import type { useEffect, useLayoutEffect } from 'react';
import { useRef } from 'react';

/**
 * Type representing either useEffect or useLayoutEffect hook
 */
type EffectHookType = typeof useEffect | typeof useLayoutEffect;

/**
 * Creates a modified effect hook that only runs on updates, skipping the initial mount
 *
 * @param hook - The effect hook to modify (useEffect or useLayoutEffect)
 * @returns A new effect hook that only executes on updates
 * @example
 * ```ts
 * const useUpdateEffect = createUpdateEffect(useEffect)
 * const useUpdateLayoutEffect = createUpdateEffect(useLayoutEffect)
 * ```
 */
export const createUpdateEffect: (hook: EffectHookType) => EffectHookType =
  (hook) => (effect, deps) => {
    // Track whether component has mounted
    const isMounted = useRef(false);

    // Reset mounted state when component unmounts (helps with React strict mode)
    hook(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    // Only execute effect if component has already mounted once
    hook(() => {
      if (isMounted.current) {
        // Run effect on subsequent updates
        return effect();
      }

      // Skip effect on initial mount and set mounted flag
      isMounted.current = true;
    }, deps);
  };
