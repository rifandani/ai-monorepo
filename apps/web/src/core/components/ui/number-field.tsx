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
import { twJoin } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import {
  Description,
  FieldError,
  FieldGroup,
  Input,
  Label,
} from '@/core/components/ui/field';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

const fieldBorderStyles = tv({
  base: `
    group-focus:border-primary/70
    forced-colors:border-[Highlight]
  `,
  variants: {
    isInvalid: {
      true: `
        group-focus:border-danger/70
        forced-colors:border-[Mark]
      `,
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
      <FieldGroup
        className={twJoin(
          isMobile && [
            '**:[button]:inset-ring **:[button]:inset-ring-fg/5 **:[button]:grid **:[button]:size-8 **:[button]:place-content-center',
            '*:[button]:first:ml-1 *:[button]:last:mr-1',
            '**:[button]:bg-secondary **:[button]:pressed:bg-secondary/80',
          ]
        )}
      >
        {(renderProps) => (
          <>
            {isMobile ? <StepperButton slot="decrement" /> : null}
            <Input
              className="px-[calc(--spacing(12)-1px)] tabular-nums"
              placeholder={placeholder}
            />
            {isMobile ? (
              <StepperButton slot="increment" />
            ) : (
              <div
                className={fieldBorderStyles({
                  ...renderProps,
                  className: 'grid place-content-center sm:border-s',
                })}
              >
                <div className="flex h-full flex-col">
                  <StepperButton
                    className="h-4 px-1"
                    emblemType="chevron"
                    slot="increment"
                  />
                  <div
                    className={fieldBorderStyles({
                      ...renderProps,
                      className: 'border-input border-b',
                    })}
                  />
                  <StepperButton
                    className="h-4 px-1"
                    emblemType="chevron"
                    slot="decrement"
                  />
                </div>
              </div>
            )}
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
        <Icon className="size-5" icon="lucide:chevron-up" />
      ) : (
        <Icon className="size-5" icon="lucide:chevron-down" />
      )
    ) : slot === 'increment' ? (
      <Icon icon="lucide:plus" />
    ) : (
      <Icon icon="lucide:minus" />
    );
  return (
    <Button
      className={composeTailwindRenderProps(
        className,
        'h-10 cursor-default pressed:text-primary-fg text-muted-fg group-disabled:bg-secondary/70 sm:pressed:bg-primary forced-colors:group-disabled:text-[GrayText]'
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
