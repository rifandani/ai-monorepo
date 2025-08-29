'use client';

import { Icon } from '@iconify/react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import type { ComponentProps } from 'react';
import { createContext, memo, useContext, useEffect, useState } from 'react';
import { composeRenderProps } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import { Response } from './response.client';

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning');
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Disclosure> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: 0,
    });

    const [hasAutoClosedRef, setHasAutoClosedRef] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
        setDuration(Math.round((Date.now() - startTime) / MS_IN_S));
        setStartTime(null);
      }
    }, [isStreaming, startTime, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends (once only)
    useEffect(() => {
      if (defaultOpen && !isStreaming && isOpen && !hasAutoClosedRef) {
        // Add a small delay before closing to allow user to see the content
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosedRef(true);
        }, AUTO_CLOSE_DELAY);

        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosedRef]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
    };

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Disclosure
          className={composeRenderProps(className, (_className) =>
            twMerge('not-prose mb-4', _className)
          )}
          isExpanded={isOpen}
          onExpandedChange={handleOpenChange}
          {...props}
        >
          {children}
        </Disclosure>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<typeof DisclosureTrigger>;

export const ReasoningTrigger = memo(
  ({ className, children, ...props }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <DisclosureTrigger
        className={composeRenderProps(className, (_className) =>
          twMerge(
            'flex items-center gap-2 text-muted-foreground text-sm',
            _className
          )
        )}
        {...props}
      >
        {children ?? (
          <>
            <Icon className="size-4" icon="lucide:brain" />
            {isStreaming || duration === 0 ? (
              <p>Thinking...</p>
            ) : (
              <p>Thought for {duration} seconds</p>
            )}
            <Icon
              className={twMerge(
                'size-4 text-muted-foreground transition-transform',
                isOpen ? 'rotate-180' : 'rotate-0'
              )}
              icon="lucide:chevron-down"
            />
          </>
        )}
      </DisclosureTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<typeof DisclosurePanel> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <DisclosurePanel
      className={composeRenderProps(className, (_className) =>
        twMerge(
          'mt-4 text-sm',
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
          _className
        )
      )}
      {...props}
    >
      <Response className="grid gap-2">{children}</Response>
    </DisclosurePanel>
  )
);

Reasoning.displayName = 'Reasoning';
ReasoningTrigger.displayName = 'ReasoningTrigger';
ReasoningContent.displayName = 'ReasoningContent';
