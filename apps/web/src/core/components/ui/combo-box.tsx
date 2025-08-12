'use client';

import { Icon } from '@iconify/react';
import type React from 'react';
import type {
  ComboBoxProps as ComboboxPrimitiveProps,
  InputProps,
  ListBoxProps,
  PopoverProps,
} from 'react-aria-components';
import {
  ComboBoxContext,
  ComboBox as ComboboxPrimitive,
  ListBox,
  useSlottedContext,
} from 'react-aria-components';
import { Button } from '@/core/components/ui/button';
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
  DropdownSection,
} from '@/core/components/ui/dropdown';
import type { FieldProps } from '@/core/components/ui/field';
import {
  Description,
  FieldError,
  FieldGroup,
  Input,
  Label,
} from '@/core/components/ui/field';
import { PopoverContent } from '@/core/components/ui/popover';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

interface ComboBoxProps<T extends object>
  extends Omit<ComboboxPrimitiveProps<T>, 'children'>,
    FieldProps {
  children: React.ReactNode;
}

function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  className,
  ...props
}: ComboBoxProps<T>) {
  return (
    <ComboboxPrimitive
      data-slot="combo-box"
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group flex w-full flex-col gap-y-1'
      )}
    >
      {label && <Label>{label}</Label>}
      {children}
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </ComboboxPrimitive>
  );
}

interface ComboBoxListProps<T extends object>
  extends Omit<ListBoxProps<T>, 'layout' | 'orientation'>,
    Pick<PopoverProps, 'placement'> {
  popover?: Omit<PopoverProps, 'children'>;
}

function ComboBoxList<T extends object>({
  children,
  items,
  className,
  popover,
  ...props
}: ComboBoxListProps<T>) {
  return (
    <PopoverContent
      className={composeTailwindRenderProps(
        popover?.className,
        'min-w-(--trigger-width) scroll-py-1 overflow-y-auto overscroll-contain'
      )}
      {...popover}
    >
      <ListBox
        className={composeTailwindRenderProps(
          className,
          "grid max-h-96 w-full grid-cols-[auto_1fr] flex-col gap-y-1 p-1 outline-hidden *:[[role='group']+[role=group]]:mt-4 *:[[role='group']+[role=separator]]:mt-1"
        )}
        items={items}
        layout="stack"
        orientation="vertical"
        {...props}
      >
        {children}
      </ListBox>
    </PopoverContent>
  );
}

function ComboBoxInput(props: InputProps) {
  const context = useSlottedContext(ComboBoxContext)!;
  return (
    <FieldGroup>
      <Input {...props} placeholder={props?.placeholder} />
      <Button
        className={
          'rounded pressed:bg-transparent outline-offset-0 hover:bg-transparent active:bg-transparent **:data-[slot=icon]:pressed:text-fg **:data-[slot=icon]:text-muted-fg **:data-[slot=icon]:hover:text-fg forced-colors:group-disabled:border-[GrayText] forced-colors:group-disabled:text-[GrayText]'
        }
        intent="plain"
        size="sq-xs"
      >
        {!context?.inputValue && (
          <Icon
            className={'size-4 shrink-0 text-muted-fg group-open:text-fg'}
            data-slot="chevron"
            icon="lucide:chevron-down"
          />
        )}
      </Button>
    </FieldGroup>
  );
}

const ComboBoxSection = DropdownSection;
const ComboBoxOption = DropdownItem;
const ComboBoxLabel = DropdownLabel;
const ComboBoxDescription = DropdownDescription;

ComboBox.Input = ComboBoxInput;
ComboBox.List = ComboBoxList;
ComboBox.Option = ComboBoxOption;
ComboBox.Label = ComboBoxLabel;
ComboBox.Description = ComboBoxDescription;
ComboBox.Section = ComboBoxSection;

export type { ComboBoxListProps, ComboBoxProps };
export { ComboBox };
