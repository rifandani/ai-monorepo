'use client';

import { Icon } from '@iconify/react';
import type React from 'react';
import type {
  DisclosureGroupProps as AccordionProps,
  ButtonProps,
  DisclosureProps as CollapsibleProps,
  DisclosurePanelProps as DisclosurePanelPrimitiveProps,
} from 'react-aria-components';
import {
  DisclosureGroup as Accordion,
  Button,
  Disclosure as Collapsible,
  DisclosurePanel as CollapsiblePanel,
  Heading,
} from 'react-aria-components';
import { composeTailwindRenderProps } from './primitive';

interface DisclosureGroupProps extends AccordionProps {
  ref?: React.RefObject<HTMLDivElement>;
}
function DisclosureGroup({
  children,
  ref,
  className,
  ...props
}: DisclosureGroupProps) {
  return (
    <Accordion
      data-slot="disclosure-group"
      ref={ref}
      {...props}
      className={composeTailwindRenderProps(
        className,
        'peer cursor-pointer disabled:cursor-not-allowed disabled:opacity-75'
      )}
    >
      {(values) => (
        <div data-slot="disclosure-content">
          {typeof children === 'function' ? children(values) : children}
        </div>
      )}
    </Accordion>
  );
}

interface DisclosureProps extends CollapsibleProps {
  ref?: React.Ref<HTMLDivElement>;
}
function Disclosure({ className, ref, ...props }: DisclosureProps) {
  return (
    <Collapsible
      data-slot="disclosure"
      ref={ref}
      {...props}
      className={composeTailwindRenderProps(
        className,
        'peer group/disclosure w-full min-w-60 border-border border-b disabled:opacity-60'
      )}
    >
      {props.children}
    </Collapsible>
  );
}

interface DisclosureTriggerProps extends ButtonProps {
  ref?: React.Ref<HTMLButtonElement>;
}
function DisclosureTrigger({
  className,
  ref,
  ...props
}: DisclosureTriggerProps) {
  return (
    <Heading>
      <Button
        className={composeTailwindRenderProps(
          className,
          'group/trigger [&[aria-expanded=true]_[data-slot=disclosure-chevron]]:-rotate-90 **:data-[slot=icon]:-mx-0.5 flex w-full items-center justify-between gap-x-2 py-3 text-left font-medium open:text-fg focus:text-fg focus:outline-hidden disabled:cursor-default disabled:opacity-50 **:data-[slot=disclosure-chevron]:size-5 **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:text-muted-fg sm:text-sm forced-colors:disabled:text-[GrayText] **:[span]:flex **:[span]:items-center **:[span]:gap-x-1 **:[span]:*:data-[slot=icon]:mr-1'
        )}
        ref={ref}
        slot="trigger"
        {...props}
      >
        {(values) => (
          <>
            {typeof props.children === 'function'
              ? props.children(values)
              : props.children}
            <Icon
              className="internal-chevron ml-auto size-4 shrink-0 transition duration-300"
              data-slot="disclosure-chevron"
              icon="mdi:chevron-left"
            />
          </>
        )}
      </Button>
    </Heading>
  );
}

interface DisclosurePanelProps extends DisclosurePanelPrimitiveProps {
  ref?: React.Ref<HTMLDivElement>;
}
function DisclosurePanel({ className, ref, ...props }: DisclosurePanelProps) {
  return (
    <CollapsiblePanel
      className={composeTailwindRenderProps(
        className,
        'overflow-hidden text-muted-fg text-sm transition-all **:data-[slot=disclosure-group]:border-t **:data-[slot=disclosure-group]:**:[.internal-chevron]:hidden has-data-[slot=disclosure-group]:**:[button]:px-4'
      )}
      data-slot="disclosure-panel"
      ref={ref}
      {...props}
    >
      <div
        className="pt-0 not-has-data-[slot=disclosure-group]:group-data-expanded/disclosure:pb-3 [&:has([data-slot=disclosure-group])_&]:px-11"
        data-slot="disclosure-panel-content"
      >
        {props.children}
      </div>
    </CollapsiblePanel>
  );
}

export type {
  DisclosureGroupProps,
  DisclosurePanelProps,
  DisclosureProps,
  DisclosureTriggerProps,
};
export { Disclosure, DisclosureGroup, DisclosurePanel, DisclosureTrigger };
