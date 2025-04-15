'use client';

import { Icon } from '@iconify/react';
import { useMediaQuery } from '@workspace/core/hooks/use-media-query';
import type {
  ButtonProps,
  NumberFieldProps as NumberFieldPrimitiveProps,
  ValidationResult,
} from 'react-aria-components';
import {
  Button,
  NumberField as NumberFieldPrimitive,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Description, FieldError, FieldGroup, Input, Label } from './field';
import { composeTailwindRenderProps } from './primitive';

const fieldBorderStyles = tv({
  base: 'group-focus:border-primary/70 forced-colors:border-[Highlight]',
  variants: {
    isInvalid: {
      true: 'group-focus:border-danger/70 forced-colors:border-[Mark]',
    },
    isDisabled: {
      true: 'group-focus:border-input/70',
    },
  },
});

interface NumberFieldProps extends NumberFieldPrimitiveProps {
  label?: string;
  description?: string;
  placeholder?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

function NumberField({
  label,
  placeholder,
  description,
  className,
  errorMessage,
  ...props
}: NumberFieldProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <NumberFieldPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group flex flex-col gap-y-1.5'
      )}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup className="overflow-hidden">
        {(renderProps) => (
          <>
            {isMobile ? (
              <StepperButton slot="decrement" className="border-r" />
            ) : null}
            <Input
              className="px-13 tabular-nums sm:px-2.5"
              placeholder={placeholder}
            />
            <div
              className={fieldBorderStyles({
                ...renderProps,
                className: 'grid h-10 place-content-center border-s',
              })}
            >
              {isMobile ? (
                <StepperButton slot="increment" />
              ) : (
                <div className="flex h-full flex-col">
                  <StepperButton
                    slot="increment"
                    emblemType="chevron"
                    className="h-5 px-1"
                  />
                  <div
                    className={fieldBorderStyles({
                      ...renderProps,
                      className: 'border-input border-b',
                    })}
                  />
                  <StepperButton
                    slot="decrement"
                    emblemType="chevron"
                    className="h-5 px-1"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </NumberFieldPrimitive>
  );
}

interface StepperButtonProps extends ButtonProps {
  slot: 'increment' | 'decrement';
  emblemType?: 'chevron' | 'default';
  className?: string;
}

function StepperButton({
  slot,
  className,
  emblemType = 'default',
  ...props
}: StepperButtonProps) {
  const icon =
    emblemType === 'chevron' ? (
      slot === 'increment' ? (
        <Icon icon="mdi:chevron-up" className="size-4" />
      ) : (
        <Icon icon="mdi:chevron-down" className="size-4" />
      )
    ) : slot === 'increment' ? (
      <Icon icon="mdi:plus" className="size-4" />
    ) : (
      <Icon icon="mdi:minus" className="size-4" />
    );
  return (
    <Button
      className={composeTailwindRenderProps(
        className,
        'h-10 cursor-default pressed:bg-primary px-3 pressed:text-primary-fg text-muted-fg group-disabled:bg-secondary/70 forced-colors:group-disabled:text-[GrayText]'
      )}
      slot={slot}
      {...props}
    >
      {icon}
    </Button>
  );
}

export type { NumberFieldProps };
export { NumberField };
