'use client';

import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';
import { twMerge } from 'tailwind-merge';

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={twMerge(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
