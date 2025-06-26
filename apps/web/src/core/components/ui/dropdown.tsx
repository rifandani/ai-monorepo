'use client';
import { Icon } from '@iconify/react';
import type React from 'react';
import type {
  ListBoxItemProps,
  SectionProps,
  SeparatorProps,
  TextProps,
} from 'react-aria-components';
import {
  Collection,
  composeRenderProps,
  Header,
  ListBoxItem as ListBoxItemPrimitive,
  ListBoxSection,
  Separator,
  Text,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { Keyboard } from './keyboard';

const dropdownItemStyles = tv({
  base: [
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] not-has-data-[slot=dropdown-item-details]:items-center has-data-[slot=dropdown-item-details]:**:data-[slot=checked-icon]:mt-[1.5px] supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
    'group relative cursor-default select-none rounded-[calc(var(--radius-lg)-1px)] px-[calc(var(--spacing)*2.3)] py-[calc(var(--spacing)*1.3)] forced-color:text-[Highlight] text-base text-fg outline-0 forced-color-adjust-none sm:text-sm/6 forced-colors:text-[LinkText]',
    '**:data-[slot=avatar]:*:mr-2 **:data-[slot=avatar]:*:size-6 **:data-[slot=avatar]:mr-2 **:data-[slot=avatar]:size-6 sm:**:data-[slot=avatar]:*:size-5 sm:**:data-[slot=avatar]:size-5',
    'data-danger:**:data-[slot=icon]:text-danger/60 **:data-[slot=icon]:size-4 **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:text-muted-fg focus:data-danger:**:data-[slot=icon]:text-danger',
    'data-[slot=menu-radio]:*:data-[slot=icon]:size-3 *:data-[slot=icon]:mr-2',
    'forced-colors:**:data-[slot=icon]:text-[CanvasText] forced-colors:group-focus:**:data-[slot=icon]:text-[Canvas] ',
    '[&>[slot=label]+[data-slot=icon]]:absolute [&>[slot=label]+[data-slot=icon]]:right-0',
  ],
  variants: {
    isDisabled: {
      true: 'text-muted-fg forced-colors:text-[GrayText]',
    },
    isSelected: {
      true: '**:data-[slot=avatar]:*:hidden **:data-[slot=avatar]:hidden **:data-[slot=icon]:hidden',
    },
    isFocused: {
      false: 'data-danger:text-danger',
      true: [
        '**:data-[slot=icon]:text-accent-fg **:[kbd]:text-accent-fg',
        'bg-accent text-accent-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
        'data-danger:bg-danger/10 data-danger:text-danger',
        'data-[slot=description]:text-accent-fg data-[slot=label]:text-accent-fg [&_.text-muted-fg]:text-accent-fg/80',
      ],
    },
  },
});

const dropdownSectionStyles = tv({
  slots: {
    section: 'col-span-full grid grid-cols-[auto_1fr]',
    header:
      'col-span-full px-2.5 py-1 font-medium text-muted-fg text-sm sm:text-xs',
  },
});

const { section, header } = dropdownSectionStyles();

interface DropdownSectionProps<T> extends SectionProps<T> {
  title?: string;
}

function DropdownSection<T extends object>({
  className,
  ...props
}: DropdownSectionProps<T>) {
  return (
    <ListBoxSection className={section({ className })}>
      {'title' in props && <Header className={header()}>{props.title}</Header>}
      <Collection items={props.items}>{props.children}</Collection>
    </ListBoxSection>
  );
}

type DropdownItemProps = ListBoxItemProps;

function DropdownItem({ className, ...props }: DropdownItemProps) {
  return (
    <ListBoxItemPrimitive
      className={composeRenderProps(className, (_className, renderProps) =>
        dropdownItemStyles({ ...renderProps, className: _className })
      )}
      textValue={
        typeof props.children === 'string' ? props.children : props.textValue
      }
      {...props}
    >
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          {isSelected && (
            <Icon
              className="-mx-0.5 mr-2"
              data-slot="checked-icon"
              icon="mdi:check"
            />
          )}
          {typeof children === 'string' ? (
            <DropdownLabel>{children}</DropdownLabel>
          ) : (
            children
          )}
        </>
      ))}
    </ListBoxItemPrimitive>
  );
}

interface DropdownItemDetailProps extends TextProps {
  label?: TextProps['children'];
  description?: TextProps['children'];
  classNames?: {
    label?: TextProps['className'];
    description?: TextProps['className'];
  };
}

function DropdownItemDetails({
  label,
  description,
  classNames,
  ...props
}: DropdownItemDetailProps) {
  const { slot, children, title, ...restProps } = props;

  return (
    <div
      className="col-start-2 flex flex-col gap-y-1"
      data-slot="dropdown-item-details"
      {...restProps}
    >
      {label && (
        <Text
          className={twMerge('font-medium sm:text-sm', classNames?.label)}
          slot={slot ?? 'label'}
          {...restProps}
        >
          {label}
        </Text>
      )}
      {description && (
        <Text
          className={twMerge('text-muted-fg text-xs', classNames?.description)}
          slot={slot ?? 'description'}
          {...restProps}
        >
          {description}
        </Text>
      )}
      {!title && children}
    </div>
  );
}

interface DropdownLabelProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>;
}

function DropdownLabel({ className, ref, ...props }: DropdownLabelProps) {
  return (
    <Text
      className={twMerge('col-start-2', className)}
      ref={ref}
      slot="label"
      {...props}
    />
  );
}

function DropdownSeparator({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      className={twMerge('-mx-1 col-span-full my-1 h-px bg-border', className)}
      orientation="horizontal"
      {...props}
    />
  );
}

function DropdownKeyboard({
  className,
  ...props
}: React.ComponentProps<typeof Keyboard>) {
  return (
    <Keyboard
      className={twMerge('absolute right-2 pl-2', className)}
      {...props}
    />
  );
}

/**
 * Note: This is not exposed component, but it's used in other components to render dropdowns.
 * @internal
 */
export type {
  DropdownItemDetailProps,
  DropdownItemProps,
  DropdownLabelProps,
  DropdownSectionProps,
};
export {
  DropdownItem,
  DropdownItemDetails,
  dropdownItemStyles,
  DropdownKeyboard,
  DropdownLabel,
  DropdownSection,
  dropdownSectionStyles,
  DropdownSeparator,
};
