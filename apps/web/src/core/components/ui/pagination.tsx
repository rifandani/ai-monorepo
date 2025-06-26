'use client';

import { Icon } from '@iconify/react';
import type React from 'react';
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
import { buttonStyles } from './button';
import { composeTailwindRenderProps } from './primitive';

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

interface PaginationItemProps extends ListBoxItemProps {
  children?: React.ReactNode;
  className?: string;
  intent?: 'primary' | 'secondary' | 'outline' | 'plain';
  size?: 'medium' | 'large' | 'square-petite' | 'extra-small' | 'small';
  shape?: 'square' | 'circle';
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
  size = 'small',
  intent = 'outline',
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
          size: 'small',
          className: twMerge(
            'cursor-pointer font-normal text-fg data-focus-visible:border-primary data-focus-visible:bg-primary/10 data-focus-visible:ring-4 data-focus-visible:ring-primary/20',
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
            'flex size-9 items-center justify-center rounded-lg border border-transparent focus:outline-hidden data-focus-visible:border-primary data-focus-visible:bg-primary/10 data-focus-visible:ring-4 data-focus-visible:ring-primary/20',
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
          <Icon className="size-4" icon="mdi:dots-horizontal" />
        </span>
      );
    case 'previous':
      return renderPaginationIndicator(
        <Icon className="size-4" icon="mdi:chevron-left" />
      );
    case 'next':
      return renderPaginationIndicator(
        <Icon className="size-4" icon="mdi:chevron-right" />
      );
    case 'first':
      return renderPaginationIndicator(
        <Icon className="size-4" icon="tdesign:previous" />
      );
    case 'last':
      return renderPaginationIndicator(
        <Icon className="size-4" icon="tdesign:next" />
      );
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
              'cursor-pointer font-normal tabular-nums disabled:cursor-default disabled:opacity-100 data-focus-visible:border-primary data-focus-visible:bg-primary/10 data-focus-visible:ring-4 data-focus-visible:ring-primary/20',
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
