'use client';

import { Icon } from '@iconify/react';
import type { ToolUIPart } from 'ai';
import type { ComponentProps, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { CodeBlock } from '@/core/components/code-block.client';
import { composeTailwindRenderProps } from '@/core/components/ui';
import { Badge } from '@/core/components/ui/badge';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';

export type ToolProps = ComponentProps<typeof Disclosure>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Disclosure
    className={composeTailwindRenderProps(
      className,
      'not-prose mb-4 w-full rounded-md border'
    )}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart['type'];
  state: ToolUIPart['state'];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart['state']) => {
  const labels = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'output-available': 'Completed',
    'output-error': 'Error',
  } as const;

  const icons = {
    'input-streaming': <Icon className="size-4" icon="lucide:circle" />,
    'input-available': (
      <Icon className="size-4 animate-pulse" icon="lucide:clock" />
    ),
    'output-available': (
      <Icon className="size-4 text-green-600" icon="lucide:check-circle" />
    ),
    'output-error': (
      <Icon className="size-4 text-red-600" icon="lucide:x-circle" />
    ),
  } as const;

  return (
    <Badge className="rounded-full text-xs" intent="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <DisclosureTrigger
    className={twMerge(
      'flex w-full items-center justify-between gap-4 p-3',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" icon="lucide:wrench" />
      <span className="font-medium text-sm">{type}</span>
      {getStatusBadge(state)}
    </div>
    <Icon
      className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
      icon="lucide:chevron-down"
    />
  </DisclosureTrigger>
);

export type ToolContentProps = ComponentProps<typeof DisclosurePanel>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <DisclosurePanel
    className={composeTailwindRenderProps(
      className,
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in'
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div
    className={twMerge('space-y-2 overflow-hidden p-4', className)}
    {...props}
  >
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock language="json" value={JSON.stringify(input, null, 2)} />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ReactNode;
  errorText: ToolUIPart['errorText'];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div className={twMerge('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={twMerge(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground'
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output && <div>{output}</div>}
      </div>
    </div>
  );
};
