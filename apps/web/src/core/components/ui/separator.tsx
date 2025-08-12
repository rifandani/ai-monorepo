'use client';

import type { SeparatorProps } from 'react-aria-components';
import { Separator as Divider } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

function Separator({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  return (
    <Divider
      {...props}
      className={twMerge(
        'shrink-0 bg-border forced-colors:bg-[ButtonBorder]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
    />
  );
}

export type { SeparatorProps };
export { Separator };
