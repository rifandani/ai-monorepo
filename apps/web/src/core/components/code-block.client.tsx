'use client';

import { Button } from '@/core/components/ui/button';
import { Icon } from '@iconify/react';
import { useCopyToClipboard } from '@workspace/core/hooks/use-copy-to-clipboard';
import { saveFile } from '@workspace/core/utils/dom';
import { generateId } from 'ai';
import { type FC, memo, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { toast } from 'sonner';

interface Props {
  language: string;
  value: string;
}

interface languageMap {
  [key: string]: string | undefined;
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css',
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
};

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const handleDownload = useCallback(() => {
    const fileExtension = programmingLanguages[language] || '.file';
    const suggestedFileName = `file-${generateId()}${fileExtension}`;
    const fileName = window.prompt('Enter file name', suggestedFileName);
    const blob = new Blob([value], { type: 'text/plain' });

    saveFile(blob, fileName ?? suggestedFileName);
  }, [language, value]);

  const handleCopy = useCallback(() => {
    if (isCopied) {
      return;
    }

    copyToClipboard(value);
    toast.success('Code copied to clipboard');
  }, [isCopied, copyToClipboard, value]);

  return (
    <div className="codeblock relative my-2 w-full rounded-lg bg-neutral-800 font-sans">
      <div className="flex w-full items-center justify-between rounded-t-lg bg-neutral-700 px-6 py-1 pr-4 text-zinc-100">
        <span className="text-xs lowercase">{language}</span>
        <div className="flex items-center space-x-1">
          <Button
            type="button"
            intent="plain"
            appearance="plain"
            size="square-petite"
            className="focus-visible:ring-1"
            onClick={handleDownload}
          >
            <Icon icon="lucide:download" className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            type="button"
            intent="plain"
            appearance="plain"
            size="square-petite"
            className="text-xs focus-visible:ring-1 focus-visible:ring-offset-0"
            onClick={handleCopy}
          >
            {isCopied ? (
              <Icon icon="lucide:check" className="h-4 w-4" />
            ) : (
              <Icon icon="lucide:copy" className="h-4 w-4" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={materialDark}
        PreTag="div"
        showLineNumbers
        customStyle={{
          margin: 0,
          width: '100%',
          background: 'transparent',
          padding: '1.5rem 1rem',
        }}
        lineNumberStyle={{
          userSelect: 'none',
        }}
        codeTagProps={{
          style: {
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)',
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };
