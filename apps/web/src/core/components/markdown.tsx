'use client';

import { CodeBlock } from '@/core/components/code-block';
import { marked } from 'marked';
import Link from 'next/link';
import type React from 'react';
import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
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

const components: Partial<Components> = {
  // table({ node, className, children, ...props }) {
  //   return (
  //     <Table className={className} {...props}>
  //       {children}
  //     </Table>
  //   );
  // },
  // thead({ node, className, children, ...props }) {
  //   return (
  //     <Table.Header className={className} {...props}>
  //       {children}
  //     </Table.Header>
  //   );
  // },
  // tbody({ node, className, children, ...props }) {
  //   return (
  //     <Table.Body className={className} {...props}>
  //       {children}
  //     </Table.Body>
  //   );
  // },
  // td({ node, className, children, ...props }) {
  //   return (
  //     <Table.Cell className={className} {...props}>
  //       {children}
  //     </Table.Cell>
  //   );
  // },
  // tr({ node, className, children, ...props }) {
  //   return (
  //     <Table.Row className={className} {...props}>
  //       {children}
  //     </Table.Row>
  //   );
  // },
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
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
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
  rehypeKatex, // KaTeX
];

const NonMemoizedMarkdown = ({
  children,
  ...props
}: React.ComponentProps<typeof ReactMarkdown>) => {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
      {...props}
    >
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
