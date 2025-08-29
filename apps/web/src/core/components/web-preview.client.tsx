'use client';

import { Icon } from '@iconify/react';
import type { ComponentProps, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { Button } from '@/core/components/ui/button';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import { TextField } from '@/core/components/ui/text-field';
import { Tooltip } from '@/core/components/ui/tooltip';

export type WebPreviewContextValue = {
  url: string;
  setUrl: (url: string) => void;
  consoleOpen: boolean;
  setConsoleOpen: (open: boolean) => void;
};

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

const useWebPreview = () => {
  const context = useContext(WebPreviewContext);
  if (!context) {
    throw new Error('WebPreview components must be used within a WebPreview');
  }
  return context;
};

export type WebPreviewProps = ComponentProps<'div'> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};

export const WebPreview = ({
  className,
  children,
  defaultUrl = '',
  onUrlChange,
  ...props
}: WebPreviewProps) => {
  const [url, setUrl] = useState(defaultUrl);
  const [consoleOpen, setConsoleOpen] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUrlChange?.(newUrl);
  };

  const contextValue: WebPreviewContextValue = {
    url,
    setUrl: handleUrlChange,
    consoleOpen,
    setConsoleOpen,
  };

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        className={twMerge(
          'flex size-full flex-col rounded-lg border bg-card',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
};

export type WebPreviewNavigationProps = ComponentProps<'div'>;

export const WebPreviewNavigation = ({
  className,
  children,
  ...props
}: WebPreviewNavigationProps) => (
  <div
    className={twMerge('flex items-center gap-1 border-b p-2', className)}
    {...props}
  >
    {children}
  </div>
);

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const WebPreviewNavigationButton = ({
  onClick,
  isDisabled,
  tooltip,
  children,
  ...props
}: WebPreviewNavigationButtonProps) => (
  <Tooltip>
    <Tooltip.Trigger
      className="h-8 w-8 p-0 hover:text-foreground"
      intent="plain"
      isDisabled={isDisabled}
      onClick={onClick}
      size="sm"
      {...props}
    >
      {children}
    </Tooltip.Trigger>

    <Tooltip.Content>
      <p>{tooltip}</p>
    </Tooltip.Content>
  </Tooltip>
);

export type WebPreviewUrlProps = ComponentProps<typeof TextField>;

export const WebPreviewUrl = ({
  value,
  onChange,
  onKeyDown,
  ...props
}: WebPreviewUrlProps) => {
  const { url, setUrl } = useWebPreview();

  return (
    <TextField
      className="h-8 flex-1 text-sm"
      onChange={onChange}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          const target = event.target as HTMLInputElement;
          setUrl(target.value);
        }
        onKeyDown?.(event);
      }}
      placeholder="Enter URL..."
      value={value ?? url}
      {...props}
    />
  );
};

export type WebPreviewBodyProps = ComponentProps<'iframe'> & {
  loading?: ReactNode;
};

export const WebPreviewBody = ({
  className,
  loading,
  src,
  ...props
}: WebPreviewBodyProps) => {
  const { url } = useWebPreview();

  return (
    <div className="flex-1">
      <iframe
        className={twMerge('size-full', className)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        src={(src ?? url) || undefined}
        title="Preview"
        {...props}
      />
      {loading}
    </div>
  );
};

export type WebPreviewConsoleProps = ComponentProps<'div'> & {
  logs?: Array<{
    level: 'log' | 'warn' | 'error';
    message: string;
    timestamp: Date;
  }>;
};

export const WebPreviewConsole = ({
  className,
  logs = [],
  children,
  ...props
}: WebPreviewConsoleProps) => {
  const { consoleOpen, setConsoleOpen } = useWebPreview();

  return (
    <Disclosure
      className={twMerge('border-t bg-muted/50 font-mono text-sm', className)}
      isExpanded={consoleOpen}
      onExpandedChange={setConsoleOpen}
      {...props}
    >
      <DisclosureTrigger className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/50">
        Console
        <Icon
          className={twMerge(
            'h-4 w-4 transition-transform duration-200',
            consoleOpen && 'rotate-180'
          )}
          icon="lucide:chevron-down"
        />
      </DisclosureTrigger>
      <DisclosurePanel
        className={twMerge(
          'px-4 pb-4',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in'
        )}
      >
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No console output</p>
          ) : (
            logs.map((log, index) => (
              <div
                className={twMerge(
                  'text-xs',
                  log.level === 'error' && 'text-destructive',
                  log.level === 'warn' && 'text-yellow-600',
                  log.level === 'log' && 'text-foreground'
                )}
                key={`${log.timestamp.getTime()}-${index}`}
              >
                <span className="text-muted-foreground">
                  {log.timestamp.toLocaleTimeString()}
                </span>{' '}
                {log.message}
              </div>
            ))
          )}
          {children}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
};
