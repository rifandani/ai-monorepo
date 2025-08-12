'use client';

import { Icon } from '@iconify/react';
import type { TreeItemProps, TreeProps } from 'react-aria-components';
import {
  Button,
  composeRenderProps,
  TreeItemContent as TreeContentPrimitive,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
} from 'react-aria-components';
import { twJoin, twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { Checkbox } from '@/core/components/ui/checkbox';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

function Tree<T extends object>({ className, ...props }: TreeProps<T>) {
  return (
    <TreePrimitive
      className={composeTailwindRenderProps(
        className,
        twJoin(
          'flex max-h-96 min-w-72 cursor-default flex-col overflow-auto rounded-lg border py-2 outline-hidden forced-color-adjust-none [scrollbar-width:thin] sm:text-sm [&::-webkit-scrollbar]:size-0.5',
          'focus-visible:outline-2 focus-visible:outline-ring/70 focus-visible:outline-offset-[-1px]'
        )
      )}
      {...props}
    />
  );
}

const treeItemStyles = tv({
  base: [
    `
      p-[0.286rem_0.286rem_0.286rem_0.571rem]
      pl-[calc((var(--tree-item-level)-1)*20px+0.571rem+var(--padding))]
      outline-hidden
      [--padding:20px]
      [&_[data-expanded]_[slot=chevron]_[data-slot=icon]]:rotate-90
    `,
    `
      [&_[slot=chevron]]:outline-hidden
      [&_[slot=chevron]_[data-slot=icon]]:text-muted-fg
    `,
    'data-has-child-rows:[--padding:0px]',
  ],
  variants: {
    isExpanded: {
      true: `
        [&_[slot=chevron]_[data-slot=icon]]:rotate-90
        [&_[slot=chevron]_[data-slot=icon]]:text-fg
        [&_[slot=chevron]_[data-slot=icon]]:transition
        [&_[slot=chevron]_[data-slot=icon]]:duration-200
      `,
    },
    isFocusVisible: {
      true: `
        focus:outline-hidden
        focus-visible:ring-1 focus-visible:ring-primary
        [&_[slot=chevron]_[data-slot=icon]]:text-fg
      `,
    },
    isDisabled: {
      true: `
        opacity-50
        forced-colors:text-[GrayText]
      `,
    },
  },
});

function TreeItem<T extends object>({ className, ...props }: TreeItemProps<T>) {
  return (
    <TreeItemPrimitive
      className={composeRenderProps(className, (className, renderProps) =>
        treeItemStyles({
          ...renderProps,
          className,
        })
      )}
      {...props}
    >
      {props.children}
    </TreeItemPrimitive>
  );
}

interface TreeContentProps
  extends React.ComponentProps<typeof TreeContentPrimitive> {
  className?: string;
}

function TreeContent({ className, ...props }: TreeContentProps) {
  return (
    <TreeContentPrimitive {...props}>
      <div className={twMerge('flex items-center', className)}>
        {props.children as React.ReactNode}
      </div>
    </TreeContentPrimitive>
  );
}

function TreeIndicator() {
  return (
    <Button className="relative shrink-0" slot="chevron">
      <Icon className="size-5" icon="lucide:chevron-right" />
    </Button>
  );
}

function TreeCheckbox() {
  return <Checkbox slot="selection" />;
}

function TreeLabel(props: React.ComponentProps<'span'>) {
  return <span {...props} />;
}

export type { TreeItemProps, TreeProps };
export { Tree, TreeCheckbox, TreeContent, TreeIndicator, TreeItem, TreeLabel };
