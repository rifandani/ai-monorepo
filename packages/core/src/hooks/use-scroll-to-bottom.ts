import { type RefObject, useEffect, useRef } from 'react';

/**
 * Scrolls to the bottom of a container when the end element is added.
 * @param containerRef - The ref of the container to scroll.
 * @param endRef - The ref of the end element to scroll to.
 * @returns A tuple containing the container ref and the end ref.
 */
export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  const containerRef = useRef<T | null>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver(() => {
        end.scrollIntoView({ behavior: 'instant', block: 'end' });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
