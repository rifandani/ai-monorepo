'use client';

import { Icon } from '@iconify/react';
import type { ChatStatus } from 'ai';
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from 'react';
import { Children } from 'react';
import { twMerge } from 'tailwind-merge';
import { composeTailwindRenderProps } from '@/core/components/ui';
import { Button } from '@/core/components/ui/button';
import { Select } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={twMerge(
      'w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm',
      className
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = 'What would you like to know?',
  minHeight = 48,
  maxHeight = 164,
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <Textarea
      className={composeTailwindRenderProps(className, [
        'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
        'field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent',
        'focus-visible:ring-0',
      ])}
      name="message"
      onChange={(e) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={twMerge('flex items-center justify-between p-1', className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={twMerge(
      'flex items-center gap-1',
      '[&_button:first-child]:rounded-bl-xl',
      className
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  intent = 'plain',
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? undefined : 'xs';

  return (
    <Button
      className={composeTailwindRenderProps(className, [
        'shrink-0 gap-1.5 rounded-lg',
        intent === 'plain' && 'text-muted-foreground',
        newSize === undefined && 'px-3',
      ])}
      intent={intent}
      size={newSize}
      type="button"
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  intent,
  size = 'xs',
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icons = <Icon className="size-4" icon="lucide:send" />;

  if (status === 'submitted') {
    Icons = <Icon className="size-4 animate-spin" icon="lucide:loader" />;
  } else if (status === 'streaming') {
    Icons = <Icon className="size-4" icon="lucide:square" />;
  } else if (status === 'error') {
    Icons = <Icon className="size-4" icon="lucide:x" />;
  }

  return (
    <Button
      className={composeTailwindRenderProps(className, 'gap-1.5 rounded-lg')}
      intent={intent}
      size={size}
      type="submit"
      {...props}
    >
      {children ?? Icons}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof Select.Trigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <Select.Trigger
    className={twMerge(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof Select.List
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <Select.List className={className} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<
  typeof Select.Option
>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <Select.Option className={className} {...props} />
);
