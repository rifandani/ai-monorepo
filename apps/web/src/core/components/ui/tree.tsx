'use client';

import { Icon } from '@iconify/react';
import type React from 'react';
import type { TreeItemProps, TreeProps } from 'react-aria-components';
import {
  Button,
  TreeItemContent as TreeItemContentPrimitive,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
  composeRenderProps,
} from 'react-aria-components';
import { twJoin } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { Checkbox } from './checkbox';
import { composeTailwindRenderProps } from './primitive';

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
    >
      {props.children}
    </TreePrimitive>
  );
}

const itemStyles = tv({
  base: [
    'p-[0.286rem_0.286rem_0.286rem_0.571rem] pl-[calc((var(--tree-item-level)-1)*20px+0.571rem+var(--padding))] outline-hidden [--padding:20px] [&_[data-expanded]_[slot=chevron]_[data-slot=icon]]:rotate-90',
    '[&_[slot=chevron]]:outline-hidden [&_[slot=chevron]_[data-slot=icon]]:text-muted-fg',
    'data-has-child-rows:[--padding:0px]',
  ],
  variants: {
    isExpanded: {
      true: '[&_[slot=chevron]_[data-slot=icon]]:rotate-90 [&_[slot=chevron]_[data-slot=icon]]:text-fg [&_[slot=chevron]_[data-slot=icon]]:transition [&_[slot=chevron]_[data-slot=icon]]:duration-200',
    },
    isFocusVisible: {
      true: 'focus:outline-hidden data-focus-visible:ring-1 data-focus-visible:ring-primary [&_[slot=chevron]_[data-slot=icon]]:text-fg',
    },
    isDisabled: {
      true: 'opacity-50 forced-colors:text-[GrayText]',
    },
  },
});

function TreeItem<T extends object>({ className, ...props }: TreeItemProps<T>) {
  return (
    <TreeItemPrimitive
      className={composeRenderProps(className, (className, renderProps) =>
        itemStyles({
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

function TreeItemContent(
  props: React.ComponentProps<typeof TreeItemContentPrimitive>
) {
  return (
    <TreeItemContentPrimitive {...props}>
      <div className="flex items-center">
        {props.children as React.ReactNode}
      </div>
    </TreeItemContentPrimitive>
  );
}

function TreeIndicator() {
  return (
    <Button className="relative shrink-0" slot="chevron">
      <Icon icon="mdi:chevron-right" className="size-5" />
    </Button>
  );
}

function TreeItemCheckbox() {
  return <Checkbox slot="selection" />;
}

function TreeItemLabel(props: React.ComponentProps<'span'>) {
  return <span {...props} />;
}

TreeItem.Label = TreeItemLabel;
TreeItem.Indicator = TreeIndicator;
TreeItem.Checkbox = TreeItemCheckbox;
TreeItem.Content = TreeItemContent;

export type { TreeItemProps, TreeProps };
export { Tree, TreeItem };
