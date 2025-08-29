'use client';

import { Icon } from '@iconify/react';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { composeRenderProps } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { Button } from '@/core/components/ui/button';

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={twMerge('relative flex-1 overflow-y-auto', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content className={twMerge('p-4', className)} {...props} />
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={composeRenderProps(className, (_className) =>
          twMerge(
            'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
            _className
          )
        )}
        intent="plain"
        onClick={handleScrollToBottom}
        size="sq-xs"
        type="button"
        {...props}
      >
        <Icon className="size-4" icon="lucide:arrow-down" />
      </Button>
    )
  );
};
