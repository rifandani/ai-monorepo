'use client';

import { CodeBlock } from '@/core/components/code-block.client';
import { marked } from 'marked';
// import mermaid from 'mermaid';
import Link from 'next/link';
import type React from 'react';
import { memo } from 'react';
import type ReactMarkdown from 'react-markdown';
import { type Components, MarkdownHooks } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { twMerge } from 'tailwind-merge';
import 'katex/dist/katex.min.css';

// to make it work synchronously with `strategy: 'pre-mermaid'`
// mermaid.initialize({ startOnLoad: true });

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

const components: Partial<Components> = {
  table({ node, className, children, ...props }) {
    return (
      <table
        className={twMerge(
          'table w-full min-w-full caption-bottom border-spacing-0 text-sm outline-hidden [--table-selected-bg:color-mix(in_oklab,var(--color-primary)_5%,white_90%)] **:data-drop-target:border **:data-drop-target:border-primary dark:[--table-selected-bg:color-mix(in_oklab,var(--color-primary)_25%,black_70%)]',
          className
        )}
        {...props}
      >
        {children}
      </table>
    );
  },
  thead({ node, className, children, ...props }) {
    return (
      <thead
        data-slot="table-header"
        className={twMerge('border-b', className)}
        {...props}
      >
        {children}
      </thead>
    );
  },
  tbody({ node, className, children, ...props }) {
    return (
      <tbody
        data-slot="table-body"
        className={twMerge('[&_.tr:last-child]:border-0', className)}
        {...props}
      >
        {children}
      </tbody>
    );
  },
  th({ node, className, children, ...props }) {
    return (
      <th
        data-slot="table-column"
        className={twMerge(
          'relative allows-sorting:cursor-pointer whitespace-nowrap px-3 py-3 text-left font-medium outline-hidden data-dragging:cursor-grabbing [&:has([slot=selection])]:pr-0',
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  },
  tr({ node, className, children, ...props }) {
    return (
      <tr
        data-slot="table-row"
        className={twMerge(
          'tr group relative cursor-default border-b bg-bg selected:bg-(--table-selected-bg) text-muted-fg outline-hidden ring-primary selected:hover:bg-(--table-selected-bg)/70 focus:ring-0 data-focus-visible:ring-1 dark:selected:hover:bg-[color-mix(in_oklab,var(--color-primary)_30%,black_70%)]',
          'href' in props
            ? 'cursor-pointer hover:bg-secondary/50 hover:text-secondary-fg'
            : '',
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  },
  td({ node, className, children, ...props }) {
    return (
      <td
        data-slot="table-cell"
        className={twMerge(
          'group whitespace-nowrap px-3 py-3 outline-hidden',
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  },
  code({ node, className, children, ...props }) {
    if ((children as React.ReactNode[])?.length) {
      // biome-ignore lint/nursery/useCollapsedIf: <explanation>
      if ((children as React.ReactNode[])?.[0] === '▍') {
        return <span className="mt-1 animate-pulse cursor-default">▍</span>;
      }
      // (children as string[])[0] = (children as string[])?.[0]?.replace(
      //   '`▍`',
      //   '▍'
      // ) as string;
    }

    const match = /language-(\w+)/.exec(className || '');

    if (!match) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <CodeBlock
        key={Math.random()}
        language={match[1] || ''}
        value={String(children).replace(/\n$/, '')}
        {...props}
      />
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ol>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ul>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="mt-6 mb-2 font-semibold text-3xl" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="mt-6 mb-2 font-semibold text-2xl" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="mt-6 mb-2 font-semibold text-xl" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="mt-6 mb-2 font-semibold text-lg" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="mt-6 mb-2 font-semibold text-base" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="mt-6 mb-2 font-semibold text-sm" {...props}>
        {children}
      </h6>
    );
  },
};

const remarkPlugins = [
  remarkGfm, // github flavored markdown
  remarkMath, // math
];
const rehypePlugins = [
  rehypeKatex, // kaTeX
  // [rehypeMermaid, { strategy: 'pre-mermaid' }], // mermaid
  rehypeMermaid, // mermaid
  rehypeStringify, // stringify
];

const NonMemoizedMarkdown = ({
  children,
  ...props
}: React.ComponentProps<typeof ReactMarkdown>) => {
  return (
    <MarkdownHooks
      components={components}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      {...props}
    >
      {children}
    </MarkdownHooks>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
