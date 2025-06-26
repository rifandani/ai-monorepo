'use client';

import type { LanguageModelV1Source } from '@ai-sdk/provider';
import type { useChat } from '@ai-sdk/react';
import { Icon } from '@iconify/react';
import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { isEqual } from 'radashi';
import React, { lazy, memo, Suspense } from 'react';
import { twMerge } from 'tailwind-merge';
import { match, P } from 'ts-pattern';
import { ChatMessageActions } from '@/core/components/chat-message-actions.client';
import { ChatMessageConfirmation } from '@/core/components/chat-message-confirmation.client';
import { ChatMessageDeepResearch } from '@/core/components/chat-message-deep-research.client';
import { Badge, Card, Link, Loader } from '@/core/components/ui';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import type { MetadataAnnotation } from '@/core/schemas/ai';
import { getToolsRequiringConfirmation, tools } from '@/core/services/ai';
import { formatElapsedTime } from '@/core/utils/time';

// required to avoid theme hydration mismatch
const LazySpreadsheetEditor = lazy(() =>
  import('@/core/components/sheet-editor.client').then((mod) => ({
    default: mod.SpreadsheetEditor,
  }))
);

const LazyMarkdown = lazy(() =>
  import('@/core/components/markdown.client').then((mod) => ({
    default: mod.Markdown,
  }))
);

const toolsWithConfirmation = {
  getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
};

function PureChatMessage({
  message,
  addToolResult,
  onRetry,
}: {
  message: UIMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  onRetry: (messageId: string) => void;
}) {
  const toolsRequiringConfirmation = getToolsRequiringConfirmation(
    toolsWithConfirmation
  );

  return (
    <AnimatePresence>
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className="group/message flex flex-col gap-y-2 whitespace-pre-wrap data-[role=user]:items-end"
        data-role={message.role}
        data-testid={`message-${message.id}`}
        initial={{ y: 5, opacity: 0 }}
        key={message.id}
      >
        {message.experimental_attachments?.map((attachment, index) =>
          match(attachment)
            .with(
              { contentType: P.string.startsWith('image/') },
              (_attachment) => (
                <img
                  alt={_attachment.name ?? `attachment-${index}`}
                  className="aspect-square w-60 rounded-lg"
                  data-testid={`attachment-${_attachment.name ?? _attachment.url}`}
                  key={`attachment-${_attachment.name ?? _attachment.url}`}
                  src={_attachment.url}
                />
              )
            )
            .with({ contentType: 'application/pdf' }, (_attachment) => (
              <iframe
                className="rounded-lg"
                data-testid={`attachment-${_attachment.name ?? _attachment.url}`}
                height="400"
                key={`attachment-${_attachment.name ?? _attachment.url}`}
                src={_attachment.url}
                title={_attachment.name ?? `attachment-${index}`}
                width="400"
              />
            ))
            .otherwise(() => null)
        )}

        {message.parts?.map((part, idx) =>
          match(part)
            .with({ type: 'text' }, (_part) => {
              // Check if this is the last part in the array
              const isLastPart = idx === (message.parts?.length ?? 0) - 1;

              const metadata = message.annotations?.find(
                (annotation): annotation is MetadataAnnotation =>
                  annotation !== null &&
                  typeof annotation === 'object' &&
                  'type' in annotation &&
                  annotation.type === 'metadata'
              );

              return (
                <React.Fragment key={`text-${_part.text}`}>
                  <div
                    className={twMerge(
                      'relative flex flex-col',
                      message.role === 'user' &&
                        'rounded-lg bg-secondary px-3 py-2 text-secondary-foreground'
                    )}
                    data-testid="chat-message-text"
                  >
                    <Suspense fallback={<Loader />}>
                      <LazyMarkdown>{_part.text}</LazyMarkdown>
                    </Suspense>

                    {metadata && (
                      <p className="-bottom-4 absolute right-0 text-xs text-zinc-500">
                        Completed in{' '}
                        {formatElapsedTime(metadata.data?.duration)}
                      </p>
                    )}
                  </div>

                  {/* only show copy button if this is the last part */}
                  {message.role === 'assistant' && isLastPart && (
                    <ChatMessageActions
                      onRetry={() => {
                        onRetry(message.id);
                      }}
                      text={_part.text}
                    />
                  )}
                </React.Fragment>
              );
            })
            .with({ type: 'tool-invocation' }, (_part) => (
              <div
                className={twMerge(
                  ['generateImage'].includes(_part.toolInvocation.toolName) &&
                    'skeleton'
                )}
                data-testid={`tool-invocation-${_part.toolInvocation.toolCallId}`}
                data-toolargs={JSON.stringify(_part.toolInvocation.args)}
                data-toolname={_part.toolInvocation.toolName}
                data-toolstate={_part.toolInvocation.state}
                data-toolstep={_part.toolInvocation.step}
                key={`tool-invocation-${_part.toolInvocation.toolCallId}`}
              >
                {match(_part.toolInvocation)
                  .with(
                    { toolName: 'webSearchNative', state: 'result' },
                    (tool) => (
                      <Disclosure key={`${tool.toolName}-${tool.toolCallId}`}>
                        <DisclosureTrigger className="justify-normal">
                          <Badge
                            className="flex items-center gap-2"
                            shape="circle"
                          >
                            <Icon icon="lucide:link" />
                            {tool.result.sources.length} sources found
                          </Badge>
                        </DisclosureTrigger>

                        <DisclosurePanel>
                          <div className="flex flex-col gap-2">
                            {tool.result.sources.map(
                              (source: LanguageModelV1Source) => (
                                <Link
                                  className="w-full hover:underline"
                                  href={source.url}
                                  key={source.url}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  {source.title}
                                </Link>
                              )
                            )}
                          </div>
                        </DisclosurePanel>
                      </Disclosure>
                    )
                  )
                  .with(
                    { toolName: 'generateImage', state: 'result' },
                    (tool) =>
                      tool.result.files.map(
                        (file: { base64: string; mimeType: string }) => (
                          <img
                            alt={tool.args.prompt}
                            className="rounded-lg"
                            height={400}
                            key={`${tool.toolName}-file-${file.base64}`}
                            src={`data:${file.mimeType};base64,${file.base64}`}
                            width={400}
                          />
                        )
                      )
                  )
                  .with(
                    { toolName: 'generateImage', state: 'call' },
                    (tool) => (
                      <span
                        className="animate-pulse"
                        key={`${tool.toolName}-${tool.toolCallId}-generating`}
                      >
                        Generating image...
                      </span>
                    )
                  )
                  .with({ toolName: 'getPokemon', state: 'result' }, (tool) =>
                    tool.result.content.map(
                      (content: { type: 'text'; text: string }) => (
                        <p
                          className={twMerge('flex flex-col gap-2')}
                          key={`${tool.toolName}-${tool.toolCallId}-content-${content.text}`}
                        >
                          {content.text}
                        </p>
                      )
                    )
                  )
                  .with({ toolName: 'getPokemon', state: 'call' }, (tool) => (
                    <span
                      className="animate-pulse"
                      key={`${tool.toolName}-${tool.toolCallId}-generating`}
                    >
                      Calling <code>{tool.toolName}</code> MCP server...
                    </span>
                  ))
                  // for all tools that require confirmation (human in the loop)
                  .with(
                    {
                      toolName: P.when((toolName) =>
                        toolsRequiringConfirmation.includes(toolName)
                      ),
                      state: 'call',
                    },
                    (tool) => (
                      <ChatMessageConfirmation
                        addToolResult={addToolResult}
                        tool={tool}
                      />
                    )
                  )
                  .with({ toolName: 'deepResearch' }, (tool) => (
                    <ChatMessageDeepResearch
                      annotations={message.annotations}
                      toolInvocation={tool}
                    />
                  ))
                  .with(
                    { toolName: 'createSpreadsheet', state: 'call' },
                    (tool) => (
                      <span
                        className="animate-pulse"
                        key={`${tool.toolName}-${tool.toolCallId}-generating`}
                      >
                        Generating spreadsheet...
                      </span>
                    )
                  )
                  .with(
                    { toolName: 'createSpreadsheet', state: 'result' },
                    (tool) => (
                      <Card
                        data-testid={`${tool.toolName}-${tool.toolCallId}-result`}
                      >
                        <Card.Header>
                          <Card.Title>{tool.result.title}</Card.Title>
                        </Card.Header>

                        <Card.Content>
                          <Suspense fallback={<Loader />}>
                            <LazySpreadsheetEditor
                              content={tool.result.csv}
                              saveContent={() => {
                                //
                              }}
                            />
                          </Suspense>
                        </Card.Content>
                      </Card>
                    )
                  )
                  .with(
                    { toolName: 'webSearch', state: P.not('result') },
                    () => (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="animate-pulse bg-zinc-50 p-2 font-mono text-xs"
                        initial={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        Searching web...
                      </motion.div>
                    )
                  )
                  .otherwise(() => null)}
              </div>
            ))
            .otherwise(() => null)
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export const ChatMessage = memo(PureChatMessage, (prevProps, nextProps) => {
  if (
    prevProps.message.reasoning !== nextProps.message.reasoning ||
    prevProps.message.annotations !== nextProps.message.annotations ||
    prevProps.message.content !== nextProps.message.content ||
    !isEqual(
      prevProps.message.toolInvocations,
      nextProps.message.toolInvocations
    )
  ) {
    return false;
  }

  return true;
});
