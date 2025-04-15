'use client';

import type React from 'react';
import { Keyboard as KeyboardPrimitive } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

interface KeyboardProps extends React.HTMLAttributes<HTMLElement> {
  keys: string | string[];
  classNames?: {
    base?: string;
    kbd?: string;
  };
}

function Keyboard({ keys, classNames, className, ...props }: KeyboardProps) {
  return (
    <KeyboardPrimitive
      className={twMerge(
        'hidden text-current/70 group-hover:text-fg group-focus:text-fg group-focus:opacity-90 group-disabled:opacity-50 lg:inline-flex forced-colors:group-focus:text-[HighlightText]',
        classNames?.base
      )}
      {...props}
    >
      {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
        <kbd
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={twMerge(
            'hidden text-current/70 group-hover:text-fg group-focus:text-fg group-focus:opacity-90 group-disabled:opacity-50 lg:inline-flex forced-colors:group-focus:text-[HighlightText]',
            index > 0 && char.length > 1 && 'pl-1',
            classNames?.kbd
          )}
        >
          {char}
        </kbd>
      ))}
    </KeyboardPrimitive>
  );
}

export type { KeyboardProps };
export { Keyboard };
