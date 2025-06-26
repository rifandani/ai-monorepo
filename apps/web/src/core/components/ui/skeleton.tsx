import type React from 'react';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.ComponentProps<'div'> {
  soft?: boolean;
}

function Skeleton({ ref, soft = false, className, ...props }: SkeletonProps) {
  return (
    <div
      className={twMerge(
        'shrink-0 animate-pulse rounded-lg',
        soft ? 'bg-muted' : 'bg-secondary',
        className
      )}
      data-slot="skeleton"
      ref={ref}
      {...props}
    />
  );
}

export type { SkeletonProps };
export { Skeleton };
