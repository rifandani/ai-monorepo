'use client';

import { composeRenderProps } from 'react-aria-components';
import type { ClassNameValue } from 'tailwind-merge';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

export function composeTailwindRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tailwind: ClassNameValue
): string | ((v: T) => string) {
  return composeRenderProps(className, (className) =>
    twMerge(tailwind, className)
  );
}

export const focusRing = tv({
  variants: {
    isFocused: {
      true: `
      ring-4 ring-ring/20 outline-hidden
      data-invalid:ring-danger/20
    `,
    },
    isFocusVisible: { true: 'outline-hidden ring-4 ring-ring/20' },
    isInvalid: { true: 'ring-4 ring-danger/20' },
  },
});

export const focusStyles = tv({
  extend: focusRing,
  variants: {
    isFocused: {
      true: `
      border-ring/70
      forced-colors:border-[Highlight]
    `,
    },
    isInvalid: {
      true: `
      border-danger/70
      forced-colors:border-[Mark]
    `,
    },
  },
});
