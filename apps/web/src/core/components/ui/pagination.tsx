'use client';

import { Icon } from '@iconify/react';
import type {
  ListBoxItemProps,
  ListBoxProps,
  ListBoxSectionProps,
} from 'react-aria-components';
import {
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Separator,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import type { ButtonProps } from '@/core/components/ui/button';
import { buttonStyles } from '@/core/components/ui/button';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

type PaginationProps = React.ComponentProps<'nav'>;
function Pagination({ className, ref, ...props }: PaginationProps) {
  return (
    <nav
      aria-label="pagination"
      className={twMerge(
        'mx-auto flex w-full justify-center gap-[5px]',
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

interface PaginationSectionProps<T> extends ListBoxSectionProps<T> {
  ref?: React.RefObject<HTMLElement>;
}
function PaginationSection<T extends object>({
  className,
  ref,
  ...props
}: PaginationSectionProps<T>) {
  return (
    <ListBoxSection
      ref={ref}
      {...props}
      className={twMerge('flex h-9 gap-[5px]', className)}
    />
  );
}

interface PaginationListProps<T> extends ListBoxProps<T> {
  ref?: React.RefObject<HTMLDivElement>;
}
function PaginationList<T extends object>({
  className,
  ref,
  ...props
}: PaginationListProps<T>) {
  return (
    <ListBox
      aria-label={props['aria-label'] || 'Pagination'}
      className={composeTailwindRenderProps(
        className,
        'flex flex-row items-center gap-[5px]'
      )}
      layout="grid"
      orientation="horizontal"
      ref={ref}
      {...props}
    />
  );
}

function renderListItem(
  props: ListBoxItemProps & {
    textValue?: string;
    'aria-current'?: string | undefined;
    isDisabled?: boolean;
    className?: string;
  },
  children: React.ReactNode
) {
  return <ListBoxItem {...props}>{children}</ListBoxItem>;
}

interface PaginationItemProps
  extends ListBoxItemProps,
    Pick<ButtonProps, 'isCircle' | 'size' | 'intent'> {
  children?: React.ReactNode;
  className?: string;
  isCurrent?: boolean;
  segment?:
    | 'label'
    | 'separator'
    | 'ellipsis'
    | 'default'
    | 'last'
    | 'first'
    | 'previous'
    | 'next';
}

function PaginationItem({
  segment = 'default',
  size = 'sm',
  intent = 'plain',
  className,
  isCurrent,
  children,
  ...props
}: PaginationItemProps) {
  const textValue =
    typeof children === 'string'
      ? children
      : typeof children === 'number'
        ? children.toString()
        : undefined;

  const renderPaginationIndicator = (indicator: React.ReactNode) =>
    renderListItem(
      {
        textValue: segment,
        'aria-current': isCurrent ? 'page' : undefined,
        isDisabled: isCurrent,
        className: buttonStyles({
          intent: 'outline',
          size: 'sm',
          className: twMerge(
            `
              min-w-10 cursor-default font-normal text-fg
              focus-visible:border-primary focus-visible:bg-primary/10
              focus-visible:ring-3 focus-visible:ring-ring/20
            `,
            className
          ),
        }),
        ...props,
      },
      indicator
    );

  switch (segment) {
    case 'label':
      return renderListItem(
        {
          textValue,
          className: twMerge(
            'grid h-9 place-content-center px-3.5 tabular-nums',
            className
          ),
          ...props,
        },
        children
      );
    case 'separator':
      return renderListItem(
        {
          textValue: 'Separator',
          className: twMerge('grid h-9 place-content-center', className),
          ...props,
        },
        <Separator
          className="h-5 w-[1.5px] shrink-0 rotate-[14deg] bg-secondary-fg/40"
          orientation="vertical"
        />
      );
    case 'ellipsis':
      return renderListItem(
        {
          textValue: 'More pages',
          className: twMerge(
            `
              flex size-9 items-center justify-center rounded-lg border
              border-transparent
              focus:outline-hidden
              focus-visible:border-primary focus-visible:bg-primary/10
              focus-visible:ring-3 focus-visible:ring-ring/20
            `,
            className
          ),
          ...props,
        },
        <span
          aria-hidden
          className={twMerge(
            'flex size-9 items-center justify-center',
            className
          )}
        >
          <Icon icon="mdi:dots-horizontal" />
        </span>
      );
    case 'previous':
      return renderPaginationIndicator(<Icon icon="lucide:chevron-left" />);
    case 'next':
      return renderPaginationIndicator(<Icon icon="lucide:chevron-right" />);
    case 'first':
      return renderPaginationIndicator(
        <Icon icon="mdi:skip-previous-outline" />
      );
    case 'last':
      return renderPaginationIndicator(<Icon icon="mdi:skip-next-outline" />);
    default:
      return renderListItem(
        {
          textValue,
          'aria-current': isCurrent ? 'page' : undefined,
          isDisabled: isCurrent,
          className: buttonStyles({
            intent: isCurrent ? 'primary' : intent,
            size,
            className: twMerge(
              `
                min-w-10 cursor-default font-normal tabular-nums
                focus-visible:border-primary focus-visible:bg-primary/10
                focus-visible:ring-3 focus-visible:ring-ring/20
                disabled:cursor-default disabled:opacity-100
              `,
              className
            ),
          }),
          ...props,
        },
        children
      );
  }
}

Pagination.Item = PaginationItem;
Pagination.List = PaginationList;
Pagination.Section = PaginationSection;

export type {
  PaginationItemProps,
  PaginationListProps,
  PaginationProps,
  PaginationSectionProps,
};
export { Pagination };
