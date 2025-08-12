'use client';

import { Icon } from '@iconify/react';
import type React from 'react';
import type { GridListItemProps, GridListProps } from 'react-aria-components';
import {
  Button,
  composeRenderProps,
  GridListItem as GridListItemPrimitive,
  GridList as GridListPrimitive,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { Checkbox } from '@/core/components/ui/checkbox';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

function GridList<T extends object>({
  children,
  className,
  ...props
}: GridListProps<T>) {
  return (
    <GridListPrimitive
      className={composeTailwindRenderProps(
        className,
        'relative max-h-96 scroll-py-1 overflow-y-auto overscroll-contain rounded-lg border *:data-drop-target:border *:data-drop-target:border-accent'
      )}
      {...props}
    >
      {children}
    </GridListPrimitive>
  );
}

const itemStyles = tv({
  base: `
    group relative -mb-px flex cursor-default gap-3 border-y px-3 py-2 text-fg
    outline-hidden -outline-offset-2 transition select-none
    [--selected-item-hovered:--color-muted]/70
    [--selected-item:var(--color-muted)]/80
    first:rounded-t-md first:border-t-0
    last:mb-0 last:rounded-b-md last:border-b-0
    sm:text-sm
  `,
  variants: {
    isHovered: { true: 'bg-subtle' },
    isSelected: {
      true: `
        z-20 border-border/50 bg-(--selected-item)
        hover:bg-(--selected-item-hovered)
      `,
    },
    isFocused: {
      true: 'outline-hidden',
    },
    isFocusVisible: {
      true: `
        bg-(--selected-item) ring-1 ring-ring outline-hidden
        hover:bg-(--selected-item-hovered)
        selected:bg-(--selected-item)
      `,
    },
    isDisabled: {
      true: `
        text-muted-fg/70
        forced-colors:text-[GrayText]
      `,
    },
  },
});

function GridListItem({ className, children, ...props }: GridListItemProps) {
  const textValue =
    props.textValue || (typeof children === 'string' ? children : undefined);
  return (
    <GridListItemPrimitive
      textValue={textValue}
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        itemStyles({ ...renderProps, className })
      )}
    >
      {(values) => (
        <>
          {values.allowsDragging && (
            <Button
              className={
                'cursor-grab data-dragging:cursor-grabbing *:data-[slot=icon]:text-muted-fg'
              }
              slot="drag"
            >
              <Icon icon="lucide:menu" />
            </Button>
          )}

          <span
            aria-hidden
            className={
              'absolute inset-y-0 left-0 hidden h-full w-0.5 bg-primary group-selected:block'
            }
          />
          {values.selectionMode === 'multiple' &&
            values.selectionBehavior === 'toggle' && (
              <Checkbox className="-mr-2" slot="selection" />
            )}
          {typeof children === 'function' ? children(values) : children}
        </>
      )}
    </GridListItemPrimitive>
  );
}

function GridEmptyState({
  ref,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={twMerge('p-6', className)} ref={ref} {...props} />;
}

GridList.Item = GridListItem;
GridList.EmptyState = GridEmptyState;

export type { GridListItemProps, GridListProps };
export { GridList };
