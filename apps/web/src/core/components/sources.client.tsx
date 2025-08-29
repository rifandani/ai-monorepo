'use client';

import { Icon } from '@iconify/react';
import type { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

export type SourcesProps = ComponentProps<'div'>;

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Disclosure
    className={twMerge('not-prose mb-4 text-primary text-xs', className)}
    {...props}
  />
);

export type SourcesTriggerProps = ComponentProps<typeof DisclosureTrigger> & {
  count: number;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <DisclosureTrigger className="flex items-center gap-2" {...props}>
    {children ?? (
      <>
        <p className="font-medium">Used {count} sources</p>
        <Icon className="h-4 w-4" icon="lucide:chevron-down" />
      </>
    )}
  </DisclosureTrigger>
);

export type SourcesContentProps = ComponentProps<typeof DisclosurePanel>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <DisclosurePanel
    className={composeTailwindRenderProps(className, [
      'mt-3 flex w-fit flex-col gap-2',
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
    ])}
    {...props}
  />
);

export type SourceProps = ComponentProps<'a'>;

export const Source = ({ href, title, children, ...props }: SourceProps) => (
  <a
    className="flex items-center gap-2"
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        <Icon className="h-4 w-4" icon="lucide:book" />
        <span className="block font-medium">{title}</span>
      </>
    )}
  </a>
);
