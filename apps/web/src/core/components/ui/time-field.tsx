'use client';

import type {
  TimeFieldProps as TimeFieldPrimitiveProps,
  TimeValue,
  ValidationResult,
} from 'react-aria-components';
import { TimeField as TimeFieldPrimitive } from 'react-aria-components';

import { DateInput } from '@/core/components/ui/date-field';
import {
  Description,
  FieldError,
  FieldGroup,
  Label,
} from '@/core/components/ui/field';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

interface TimeFieldProps<T extends TimeValue>
  extends TimeFieldPrimitiveProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  prefix?: React.ReactNode | string;
  suffix?: React.ReactNode | string;
}

function TimeField<T extends TimeValue>({
  prefix,
  suffix,
  label,
  className,
  description,
  errorMessage,
  ...props
}: TimeFieldProps<T>) {
  return (
    <TimeFieldPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group/time-field flex flex-col gap-y-1 *:data-[slot=label]:font-medium'
      )}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup>
        {prefix && typeof prefix === 'string' ? (
          <span className="ml-2 text-muted-fg">{prefix}</span>
        ) : (
          prefix
        )}
        <DateInput
          className={'flex w-fit min-w-28 justify-around whitespace-nowrap'}
        />
        {suffix ? (
          typeof suffix === 'string' ? (
            <span className="mr-2 text-muted-fg">{suffix}</span>
          ) : (
            suffix
          )
        ) : null}
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TimeFieldPrimitive>
  );
}

export type { TimeFieldProps };
export { TimeField };
