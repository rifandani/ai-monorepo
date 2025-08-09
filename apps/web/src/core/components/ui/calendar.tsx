'use client';

import { Icon } from '@iconify/react';
import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone, today } from '@internationalized/date';
import { useDateFormatter } from '@react-aria/i18n';
import type { CalendarState } from '@react-stately/calendar';
import type React from 'react';
import { use } from 'react';
import type {
  CalendarProps as CalendarPrimitiveProps,
  DateValue,
} from 'react-aria-components';
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarHeaderCell,
  Calendar as CalendarPrimitive,
  CalendarStateContext,
  composeRenderProps,
  Heading,
  Text,
  useLocale,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { Button } from './button';
import { Select } from './select';

interface CalendarProps<T extends DateValue>
  extends Omit<CalendarPrimitiveProps<T>, 'visibleDuration'> {
  errorMessage?: string;
  className?: string;
}

function Calendar<T extends DateValue>({
  errorMessage,
  className,
  ...props
}: CalendarProps<T>) {
  const now = today(getLocalTimeZone());

  return (
    <CalendarPrimitive {...props}>
      <CalendarHeader />
      <CalendarGrid className="[&_td]:border-collapse [&_td]:px-0 [&_td]:py-0.5">
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              className={composeRenderProps(
                className,
                (_className, { isSelected, isDisabled }) =>
                  twMerge(
                    'relative flex size-10 cursor-default items-center justify-center rounded-lg text-fg tabular-nums outline-hidden hover:bg-secondary-fg/15 sm:size-9 sm:text-sm/6 forced-colors:text-[ButtonText] forced-colors:outline-0',
                    isSelected &&
                      'bg-primary pressed:bg-primary text-primary-fg hover:bg-primary/90 data-invalid:bg-danger data-invalid:text-danger-fg forced-colors:bg-[Highlight] forced-colors:text-[Highlight] forced-colors:data-invalid:bg-[Mark]',
                    isDisabled && 'text-muted-fg forced-colors:text-[GrayText]',
                    date.compare(now) === 0 &&
                      'after:-translate-x-1/2 after:pointer-events-none after:absolute after:start-1/2 after:bottom-1 after:z-10 after:size-[3px] after:rounded-full after:bg-primary selected:after:bg-primary-fg data-focus-visible:after:bg-primary-fg',
                    _className
                  )
              )}
              date={date}
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
      {errorMessage && (
        <Text className="text-danger text-sm/6" slot="errorMessage">
          {errorMessage}
        </Text>
      )}
    </CalendarPrimitive>
  );
}

function CalendarHeader({
  isRange,
  className,
  ...props
}: React.ComponentProps<'header'> & { isRange?: boolean }) {
  const { direction } = useLocale();
  const state = use(CalendarStateContext)!;

  return (
    <header
      className={twMerge(
        'flex w-full justify-center gap-1.5 pt-1 pr-1 pb-5 pl-1.5 sm:pb-4',
        className
      )}
      data-slot="calendar-header"
      {...props}
    >
      {!isRange && (
        <>
          <SelectMonth state={state} />
          <SelectYear state={state} />
        </>
      )}
      <Heading
        className={twMerge(
          'mr-2 flex-1 text-left font-medium text-muted-fg sm:text-sm',
          !isRange && 'sr-only',
          className
        )}
      />
      <div className="flex items-center gap-1">
        <Button
          className="size-8 **:data-[slot=icon]:text-fg sm:size-7"
          intent="plain"
          shape="circle"
          size="square-petite"
          slot="previous"
        >
          {direction === 'rtl' ? (
            <Icon className="size-4" icon="mdi:chevron-right" />
          ) : (
            <Icon className="size-4" icon="mdi:chevron-left" />
          )}
        </Button>
        <Button
          className="size-8 **:data-[slot=icon]:text-fg sm:size-7"
          intent="plain"
          shape="circle"
          size="square-petite"
          slot="next"
        >
          {direction === 'rtl' ? (
            <Icon className="size-4" icon="mdi:chevron-right" />
          ) : (
            <Icon className="size-4" icon="mdi:chevron-left" />
          )}
        </Button>
      </div>
    </header>
  );
}

function SelectMonth({ state }: { state: CalendarState }) {
  const months: string[] = [];

  const formatter = useDateFormatter({
    month: 'long',
    timeZone: state.timeZone,
  });

  const numMonths = state.focusedDate.calendar.getMonthsInYear(
    state.focusedDate
  );
  for (let i = 1; i <= numMonths; i++) {
    const date = state.focusedDate.set({ month: i });
    months.push(formatter.format(date.toDate(state.timeZone)));
  }
  return (
    <Select
      aria-label="Select month"
      className="[popover-width:8rem]"
      onSelectionChange={(value) => {
        state.setFocusedDate(state.focusedDate.set({ month: Number(value) }));
      }}
      selectedKey={
        state.focusedDate.month.toString() ??
        (new Date().getMonth() + 1).toString()
      }
    >
      <Select.Trigger className="h-8 w-22 text-xs focus:ring-3 **:data-[slot=select-value]:inline-block **:data-[slot=select-value]:truncate group-data-open:ring-3" />
      <Select.List
        className="w-34 min-w-34 max-w-34"
        popoverClassName="w-34 max-w-34 min-w-34"
      >
        {months.map((month, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Select.Option
            id={(index + 1).toString()}
            // biome-ignore lint/suspicious/noArrayIndexKey: xxx
            key={index}
            textValue={month}
          >
            <Select.Label>{month}</Select.Label>
          </Select.Option>
        ))}
      </Select.List>
    </Select>
  );
}

function SelectYear({ state }: { state: CalendarState }) {
  const years: { value: CalendarDate; formatted: string }[] = [];
  const formatter = useDateFormatter({
    year: 'numeric',
    timeZone: state.timeZone,
  });

  for (let i = -20; i <= 20; i++) {
    const date = state.focusedDate.add({ years: i });
    years.push({
      value: date,
      formatted: formatter.format(date.toDate(state.timeZone)),
    });
  }
  return (
    <Select
      aria-label="Select year"
      onSelectionChange={(value) => {
        // @ts-expect-error from justd
        state.setFocusedDate(years[Number(value)]?.value);
      }}
      selectedKey={20}
    >
      <Select.Trigger className="h-8 text-xs focus:ring-3 group-data-open:ring-3" />
      <Select.List
        className="w-34 min-w-34 max-w-34"
        popoverClassName="w-34 max-w-34 min-w-34"
      >
        {years.map((year, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: xxx
          <Select.Option id={i} key={i} textValue={year.formatted}>
            <Select.Label>{year.formatted}</Select.Label>
          </Select.Option>
        ))}
      </Select.List>
    </Select>
  );
}

function CalendarGridHeader() {
  return (
    <CalendarGridHeaderPrimitive>
      {(day) => (
        <CalendarHeaderCell className="pb-2 font-semibold text-muted-fg text-sm sm:px-0 sm:py-0.5 lg:text-xs">
          {day}
        </CalendarHeaderCell>
      )}
    </CalendarGridHeaderPrimitive>
  );
}

export type { CalendarProps };
export { Calendar, CalendarGridHeader, CalendarHeader };
