import type React from 'react';
import { twMerge } from 'tailwind-merge';

function DescriptionList({
  className,
  ref,
  ...props
}: React.ComponentProps<'dl'>) {
  return (
    <dl
      ref={ref}
      className={twMerge(
        'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,calc(var(--spacing)*80))_auto] sm:text-sm/6',
        className
      )}
      {...props}
    />
  );
}

function DescriptionTerm({
  className,
  ref,
  ...props
}: React.ComponentProps<'dt'>) {
  return (
    <dt
      ref={ref}
      className={twMerge(
        'col-start-1 border-t pt-3 text-muted-fg first:border-none sm:py-3',
        className
      )}
      {...props}
    />
  );
}

function DescriptionDetails({
  className,
  ...props
}: React.ComponentProps<'dd'>) {
  return (
    <dd
      {...props}
      className={twMerge(
        'pt-1 pb-3 text-fg sm:border-t sm:nth-2:border-none sm:py-3',
        className
      )}
    />
  );
}

DescriptionList.Term = DescriptionTerm;
DescriptionList.Details = DescriptionDetails;
export { DescriptionList };
