'use client';

import { useState } from 'react';

export interface useCopyToClipboardProps {
  timeout?: number;
}

/**
 * Hook to copy text to clipboard
 * @param timeout - Timeout for the copied state
 * @returns isCopied - Whether the text is copied
 * @returns copyToClipboard - Function to copy text to clipboard
 */
export function useCopyToClipboard(
  { timeout }: useCopyToClipboardProps = { timeout: 1_000 }
) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (value: string) => {
    if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    if (!value) {
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, timeout);
    });
  };

  return { isCopied, copyToClipboard };
}
