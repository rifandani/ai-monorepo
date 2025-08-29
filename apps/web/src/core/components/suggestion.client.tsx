'use client';

import type { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/core/components/ui/button';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';
import { ScrollArea, ScrollBar } from '@/core/components/ui/scroll-area';

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div
      className={twMerge(
        'flex w-max flex-nowrap items-center gap-2',
        className
      )}
    >
      {children}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  intent = 'outline',
  size = 'sm',
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={composeTailwindRenderProps(
        className,
        'cursor-pointer rounded-full px-4'
      )}
      intent={intent}
      onClick={handleClick}
      size={size}
      type="button"
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};
