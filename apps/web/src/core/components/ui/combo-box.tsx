'use client';

import { Icon } from '@iconify/react';
import React from 'react';
import type {
  ComboBoxProps as ComboboxPrimitiveProps,
  InputProps,
  ListBoxProps,
  ValidationResult,
} from 'react-aria-components';
import {
  Button as ButtonPrimitive,
  ComboBoxContext,
  ComboBoxStateContext,
  ComboBox as ComboboxPrimitive,
  useSlottedContext,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Button } from './button';
import { DropdownItem, DropdownLabel, DropdownSection } from './dropdown';
import { Description, FieldError, FieldGroup, Input, Label } from './field';
import { ListBox } from './list-box';
import type { PopoverContentProps } from './popover';
import { PopoverContent } from './popover';
import { composeTailwindRenderProps } from './primitive';

const comboboxStyles = tv({
  slots: {
    base: 'group flex w-full flex-col gap-y-1.5',
    chevronButton:
      'h-7 w-8 rounded pressed:bg-transparent outline-offset-0 hover:bg-transparent active:bg-transparent **:data-[slot=icon]:pressed:text-fg **:data-[slot=icon]:text-muted-fg **:data-[slot=icon]:hover:text-fg',
    chevronIcon:
      'size-4 shrink-0 transition duration-200 group-open:rotate-180 group-open:text-fg',
    clearButton:
      'absolute inset-y-0 right-0 flex items-center pr-2 text-muted-fg hover:text-fg focus:outline-hidden',
  },
});

const { base, chevronButton, chevronIcon, clearButton } = comboboxStyles();

interface ComboBoxProps<T extends object>
  extends Omit<ComboboxPrimitiveProps<T>, 'children'> {
  label?: string;
  placeholder?: string;
  description?: string | null;
  errorMessage?: string | ((validation: ValidationResult) => string);
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
      {...props}
      className={composeTailwindRenderProps(className, base())}
    >
      {label && <Label>{label}</Label>}
      {children}
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </ComboboxPrimitive>
  );
}

interface ComboBoxListProps<T extends object>
  extends ListBoxProps<T>,
    Pick<PopoverContentProps, 'placement'> {
  popoverClassName?: PopoverContentProps['className'];
}

function ComboBoxList<T extends object>({
  children,
  items,
  className,
  popoverClassName,
  ...props
}: ComboBoxListProps<T>) {
  return (
    <PopoverContent
      showArrow={false}
      respectScreen={false}
      isNonModal
      className={composeTailwindRenderProps(
        popoverClassName,
        'sm:min-w-(--trigger-width)'
      )}
      placement={props.placement}
    >
      <ListBox
        className={composeTailwindRenderProps(className, 'border-0')}
        items={items}
        {...props}
      >
        {children}
      </ListBox>
    </PopoverContent>
  );
}

function ComboBoxInput(props: InputProps) {
  const context = useSlottedContext(ComboBoxContext);
  return (
    <FieldGroup className="relative pl-0">
      <Input {...props} placeholder={props?.placeholder} />
      <Button size="square-petite" intent="plain" className={chevronButton()}>
        {!context?.inputValue && (
          <Icon icon="mdi:chevron-down" className={chevronIcon()} />
        )}
      </Button>
      {context?.inputValue && <ComboBoxClearButton />}
    </FieldGroup>
  );
}

function ComboBoxClearButton() {
  const state = React.use(ComboBoxStateContext);

  return (
    <ButtonPrimitive
      className={clearButton()}
      slot={null}
      aria-label="Clear"
      onPress={() => {
        state?.setSelectedKey(null);
        state?.open();
      }}
    >
      <Icon icon="mdi:close" className="size-4 animate-in" />
    </ButtonPrimitive>
  );
}

const ComboBoxOption = DropdownItem;
const ComboBoxLabel = DropdownLabel;
const ComboBoxSection = DropdownSection;

ComboBox.Input = ComboBoxInput;
ComboBox.List = ComboBoxList;
ComboBox.Option = ComboBoxOption;
ComboBox.Label = ComboBoxLabel;
ComboBox.Section = ComboBoxSection;

export type { ComboBoxListProps, ComboBoxProps };
export { ComboBox };
