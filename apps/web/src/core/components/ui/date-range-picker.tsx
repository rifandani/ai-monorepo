'use client';

import type { DateDuration } from '@internationalized/date';
import type { Placement } from 'react-aria';
import type {
  DateRangePickerProps as DateRangePickerPrimitiveProps,
  DateValue,
  ValidationResult,
} from 'react-aria-components';
import { DateRangePicker as DateRangePickerPrimitive } from 'react-aria-components';
import { DateInput } from '@/core/components/ui/date-field';
import {
  DatePickerIcon,
  DatePickerOverlay,
} from '@/core/components/ui/date-picker';
import {
  Description,
  FieldError,
  FieldGroup,
  Label,
} from '@/core/components/ui/field';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

interface DateRangePickerProps<T extends DateValue>
  extends DateRangePickerPrimitiveProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  visibleDuration?: DateDuration;
  pageBehavior?: 'visible' | 'single';
  contentPlacement?: Placement;
}

function DateRangePicker<T extends DateValue>({
  label,
  className,
  description,
  errorMessage,
  contentPlacement = 'bottom',
  visibleDuration = { months: 1 },
  ...props
}: DateRangePickerProps<T>) {
  return (
    <DateRangePickerPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group flex flex-col gap-y-1 *:data-[slot=label]:font-medium'
      )}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup className="w-auto min-w-40">
        <DateInput className="pl-2" slot="start" />
        <span
          aria-hidden="true"
          className={
            '-mx-2 text-fg group-disabled:text-muted-fg forced-colors:text-[ButtonText] forced-colors:group-disabled:text-[GrayText]'
          }
        >
          –
        </span>
        <DateInput className={'pr-10 sm:pr-8'} slot="end" />
        <DatePickerIcon />
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <DatePickerOverlay
        placement={contentPlacement}
        range
        visibleDuration={visibleDuration}
      />
    </DateRangePickerPrimitive>
  );
}
export type { DateRangePickerProps };
export { DateRangePicker };
