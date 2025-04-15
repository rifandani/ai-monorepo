'use client';

import type { SeparatorProps as DividerProps } from 'react-aria-components';
import { Separator as Divider } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

interface SeparatorProps extends DividerProps {
  className?: string;
}

function Separator({ className, ...props }: SeparatorProps) {
  return (
    <Divider
      {...props}
      className={twMerge(
        'shrink-0 bg-border forced-colors:bg-[ButtonBorder]',
        props.orientation === 'horizontal' ? 'h-px w-full' : 'w-px',
        className
      )}
    />
  );
}

export type { SeparatorProps };
export { Separator };
