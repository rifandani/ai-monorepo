'use client';

import type React from 'react';
import { twMerge } from 'tailwind-merge';

interface CodeBlockProps {
  node: Element;
  inline: boolean;
  className: string;
  children: React.ReactNode;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  if (!inline) {
    return (
      <div className="not-prose flex flex-col">
        <pre
          {...props}
          className="w-full overflow-x-auto rounded-xl border border-zinc-200 p-4 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <code className="whitespace-pre-wrap break-words">{children}</code>
        </pre>
      </div>
    );
  }

  return (
    <code
      className={twMerge(
        'rounded-md bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}
