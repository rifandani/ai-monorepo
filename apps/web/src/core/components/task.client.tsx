'use client';

import { Icon } from '@iconify/react';
import type { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import { composeTailwindRenderProps } from '@/core/components/ui';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';

export type TaskItemFileProps = ComponentProps<'div'>;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <div
    className={twMerge(
      'inline-flex items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-foreground text-xs',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<'div'>;

export const TaskItem = ({ children, className, ...props }: TaskItemProps) => (
  <div
    className={twMerge('text-muted-foreground text-sm', className)}
    {...props}
  >
    {children}
  </div>
);

export type TaskProps = ComponentProps<typeof Disclosure>;

export const Task = ({ isExpanded = true, className, ...props }: TaskProps) => (
  <Disclosure
    className={composeTailwindRenderProps(
      className,
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=open]:animate-in'
    )}
    isExpanded={isExpanded}
    {...props}
  />
);

export type TaskTriggerProps = ComponentProps<typeof DisclosureTrigger> & {
  title: string;
};

export const TaskTrigger = ({
  children,
  className,
  title,
  ...props
}: TaskTriggerProps) => (
  <DisclosureTrigger
    className={composeTailwindRenderProps(className, 'group')}
    {...props}
  >
    {children ?? (
      <div className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
        <Icon className="size-4" icon="lucide:search" />
        <p className="text-sm">{title}</p>
        <Icon
          className="size-4 transition-transform group-data-[state=open]:rotate-180"
          icon="lucide:chevron-down"
        />
      </div>
    )}
  </DisclosureTrigger>
);

export type TaskPanelProps = ComponentProps<typeof DisclosurePanel>;

export const TaskPanel = ({
  children,
  className,
  ...props
}: TaskPanelProps) => (
  <DisclosurePanel
    className={composeTailwindRenderProps(
      className,
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in'
    )}
    {...props}
  >
    <div className="mt-4 space-y-2 border-muted border-l-2 pl-4">
      {children}
    </div>
  </DisclosurePanel>
);
