'use client';

import { marked } from 'marked';
import mermaid from 'mermaid';
import Link from 'next/link';
import type React from 'react';
import { type ComponentProps, memo, useEffect } from 'react';
import type ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { MarkdownHooks } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';
// import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { twMerge } from 'tailwind-merge';
import { CodeBlock } from '@/core/components/code-block.client';
import 'katex/dist/katex.min.css';

/**
 * Parses markdown into blocks of text.
 * @param markdown - The markdown to parse.
 * @returns An array of blocks of text.
 * @example
 * ```ts
 * const blocks = parseMarkdownIntoBlocks(
 *   '## Hello\n\nThis is a test\n\n![Alt text](image.png)'
 * );
 * // blocks = ['## Hello', 'This is a test', '![Alt text](image.png)']
 * ```
 */
export function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

/**
 * Checks if the markdown contains LaTeX.
 * @param markdown - The markdown to check.
 * @returns True if the markdown contains LaTeX, false otherwise.
 */
export function checkLatex(markdown: string): boolean {
  return /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(markdown);
}

mermaid.initialize({ startOnLoad: true });

function Mermaid({
  node,
  className,
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
> & {
  node: unknown;
}) {
  // tried to use loading spinner but it's not working
  useEffect(() => {
    mermaid.run();
  }, []);

  return (
    <pre className={className} data-testid="markdown-pre-mermaid" {...props}>
      {children}
    </pre>
  );
}

const components: Partial<Components> = {
  pre: ({ node, className, children, ...props }) => {
    if (className === 'mermaid') {
      return (
        <Mermaid className={className} node={node} {...props}>
          {children}
        </Mermaid>
      );
    }

    return (
      <pre className={className} {...props}>
        {children}
      </pre>
    );
  },
  table({ node, className, children, ...props }) {
    return (
      <div className="overflow-x-auto" data-testid="markdown-table">
        <table
          className={twMerge(
            'table w-full min-w-full caption-bottom border-spacing-0 text-sm outline-hidden [--table-selected-bg:color-mix(in_oklab,var(--color-primary)_5%,white_90%)] **:data-drop-target:border **:data-drop-target:border-primary dark:[--table-selected-bg:color-mix(in_oklab,var(--color-primary)_25%,black_70%)]',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ node, className, children, ...props }) {
    return (
      <thead
        className={twMerge('border-b', className)}
        data-slot="table-header"
        data-testid="markdown-table-header"
        {...props}
      >
        {children}
      </thead>
    );
  },
  tbody({ node, className, children, ...props }) {
    return (
      <tbody
        className={twMerge('[&_.tr:last-child]:border-0', className)}
        data-slot="table-body"
        data-testid="markdown-table-body"
        {...props}
      >
        {children}
      </tbody>
    );
  },
  th({ node, className, children, ...props }) {
    return (
      <th
        className={twMerge(
          'relative allows-sorting:cursor-pointer whitespace-nowrap px-3 py-3 text-left font-medium outline-hidden data-dragging:cursor-grabbing [&:has([slot=selection])]:pr-0',
          className
        )}
        data-slot="table-column"
        data-testid="markdown-table-column"
        {...props}
      >
        {children}
      </th>
    );
  },
  tr({ node, className, children, ...props }) {
    return (
      <tr
        className={twMerge(
          'tr group relative cursor-default border-b bg-bg selected:bg-(--table-selected-bg) text-muted-fg outline-hidden ring-primary selected:hover:bg-(--table-selected-bg)/70 focus:ring-0 data-focus-visible:ring-1 dark:selected:hover:bg-[color-mix(in_oklab,var(--color-primary)_30%,black_70%)]',
          'href' in props
            ? 'cursor-pointer hover:bg-secondary/50 hover:text-secondary-fg'
            : '',
          className
        )}
        data-slot="table-row"
        data-testid="markdown-table-row"
        {...props}
      >
        {children}
      </tr>
    );
  },
  td({ node, className, children, ...props }) {
    return (
      <td
        className={twMerge(
          'group whitespace-nowrap px-3 py-3 outline-hidden',
          className
        )}
        data-slot="table-cell"
        data-testid="markdown-table-cell"
        {...props}
      >
        {children}
      </td>
    );
  },
  code({ node, className, children, ...props }) {
    if (
      (children as React.ReactNode[])?.length &&
      (children as React.ReactNode[])?.[0] === '▍'
    ) {
      return (
        <span
          className="mt-1 animate-pulse cursor-default"
          data-testid="markdown-code-block-loading"
        >
          ▍
        </span>
      );
    }

    const match = /language-(\w+)/.exec(className || '');

    if (!match) {
      return (
        <code
          className={className}
          data-testid="markdown-code-block-notmatch"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <CodeBlock
        data-testid="markdown-code-block"
        key={Math.random()}
        language={match[1] || ''}
        value={String(children).replace(/\n$/, '')}
        {...props}
      />
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol
        className="ml-4 list-outside list-decimal"
        data-testid="markdown-ordered-list"
        {...props}
      >
        {children}
      </ol>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul
        className="ml-4 list-outside list-decimal"
        data-testid="markdown-unordered-list"
        {...props}
      >
        {children}
      </ul>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" data-testid="markdown-list-item" {...props}>
        {children}
      </li>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        data-testid="markdown-link"
        rel="noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1
        className="mt-6 mb-2 font-semibold text-3xl"
        data-testid="markdown-heading-1"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2
        className="mt-6 mb-2 font-semibold text-2xl"
        data-testid="markdown-heading-2"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3
        className="mt-6 mb-2 font-semibold text-xl"
        data-testid="markdown-heading-3"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4
        className="mt-6 mb-2 font-semibold text-lg"
        data-testid="markdown-heading-4"
        {...props}
      >
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5
        className="mt-6 mb-2 font-semibold text-base"
        data-testid="markdown-heading-5"
        {...props}
      >
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6
        className="mt-6 mb-2 font-semibold text-sm"
        data-testid="markdown-heading-6"
        {...props}
      >
        {children}
      </h6>
    );
  },
};

const remarkPlugins = [
  remarkGfm, // github flavored markdown
  remarkMath, // math
];
const rehypePlugins: ComponentProps<typeof MarkdownHooks>['rehypePlugins'] = [
  rehypeKatex, // kaTeX
  [rehypeMermaid, { strategy: 'pre-mermaid' }],
  // rehypeMermaid, // this is not working, because this runs asynchronously
  // rehypeStringify,
];

const NonMemoizedMarkdown = ({
  children,
  ...props
}: React.ComponentProps<typeof ReactMarkdown>) => {
  return (
    // <ReactMarkdown
    <MarkdownHooks
      components={components}
      rehypePlugins={rehypePlugins}
      remarkPlugins={remarkPlugins}
      {...props}
    >
      {children}
    </MarkdownHooks>
    // </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
