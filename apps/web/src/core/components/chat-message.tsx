'use client';

import { ChatMessageActions } from '@/core/components/chat-message-actions';
import { ChatMessageDeepResearch } from '@/core/components/chat-message-deep-research';
import { Markdown } from '@/core/components/markdown';
import { Badge, Link } from '@/core/components/ui';
import { Button } from '@/core/components/ui/button';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import type { MetadataAnnotation } from '@/core/schemas/ai';
import { APPROVAL } from '@/core/services/ai';
import { formatElapsedTime } from '@/core/utils/time';
import type { LanguageModelV1Source } from '@ai-sdk/provider';
import type { useChat } from '@ai-sdk/react';
import { Icon } from '@iconify/react';
import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { isEqual } from 'radashi';
import React, { memo } from 'react';
import { twMerge } from 'tailwind-merge';
import { P, match } from 'ts-pattern';

function PureChatMessage({
  message,
  addToolResult,
  onRetry,
}: {
  message: UIMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  onRetry: (messageId: string) => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={message.id}
        data-testid={`message-${message.id}`}
        data-role={message.role}
        className="group/message flex flex-col gap-y-2 whitespace-pre-wrap data-[role=user]:items-end"
      >
        {message.experimental_attachments?.map((attachment, index) =>
          match(attachment)
            .with(
              { contentType: P.string.startsWith('image/') },
              (attachment) => (
                <img
                  key={`attachment-${attachment.name ?? attachment.url}`}
                  data-testid={`attachment-${attachment.name ?? attachment.url}`}
                  src={attachment.url}
                  alt={attachment.name ?? `attachment-${index}`}
                  className="aspect-square w-60 rounded-lg"
                />
              )
            )
            .with({ contentType: 'application/pdf' }, (attachment) => (
              <iframe
                key={`attachment-${attachment.name ?? attachment.url}`}
                data-testid={`attachment-${attachment.name ?? attachment.url}`}
                src={attachment.url}
                title={attachment.name ?? `attachment-${index}`}
                width="400"
                height="400"
                className="rounded-lg"
              />
            ))
            .otherwise(() => null)
        )}

        {message.parts?.map((part, idx) =>
          match(part)
            .with({ type: 'text' }, (part) => {
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
                <React.Fragment key={`text-${part.text}`}>
                  <div
                    data-testid="chat-message-text"
                    className={twMerge(
                      'relative flex flex-col gap-4',
                      message.role === 'user' &&
                        'rounded-lg bg-secondary px-3 py-2 text-secondary-foreground'
                    )}
                  >
                    <Markdown>{part.text}</Markdown>
                    {metadata && (
                      <p className="absolute right-0 bottom-0 text-xs text-zinc-500">
                        Completed in{' '}
                        {formatElapsedTime(metadata.data?.duration)}
                      </p>
                    )}
                  </div>

                  {/* only show copy button if this is the last part */}
                  {message.role === 'assistant' && isLastPart && (
                    <ChatMessageActions
                      text={part.text}
                      onRetry={() => {
                        onRetry(message.id);
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })
            .with({ type: 'tool-invocation' }, (part) => (
              <div
                key={`tool-invocation-${part.toolInvocation.toolCallId}`}
                data-testid={`tool-invocation-${part.toolInvocation.toolCallId}`}
                data-toolname={part.toolInvocation.toolName}
                data-toolstate={part.toolInvocation.state}
                data-toolstep={part.toolInvocation.step}
                data-toolargs={JSON.stringify(part.toolInvocation.args)}
                className={twMerge(
                  ['generateImage'].includes(part.toolInvocation.toolName) &&
                    'skeleton'
                )}
              >
                {match(part.toolInvocation)
                  .with(
                    { toolName: 'webSearchNative', state: 'result' },
                    (tool) => (
                      <Disclosure key={`webSearchNative-${tool.toolCallId}`}>
                        <DisclosureTrigger className="justify-normal">
                          <Badge
                            shape="circle"
                            className="flex items-center gap-2"
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
                                  key={source.url}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full hover:underline"
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
                            key={`generateImage-file-${file.base64}`}
                            src={`data:${file.mimeType};base64,${file.base64}`}
                            alt={tool.args.prompt}
                            height={400}
                            width={400}
                            className="rounded-lg"
                          />
                        )
                      )
                  )
                  .with(
                    { toolName: 'generateImage', state: 'call' },
                    (tool) => (
                      <div
                        key={`generateImage-${tool.toolCallId}-generating`}
                        className="animate-pulse"
                      >
                        Generating image...
                      </div>
                    )
                  )
                  .with({ toolName: 'getPokemon', state: 'result' }, (tool) =>
                    tool.result.content.map(
                      (content: { type: 'text'; text: string }) => (
                        <p
                          key={`getPokemon-${tool.toolCallId}-content-${content.text}`}
                          className={twMerge('flex flex-col gap-2')}
                        >
                          {content.text}
                        </p>
                      )
                    )
                  )
                  .with({ toolName: 'getPokemon', state: 'call' }, (tool) => (
                    <div
                      key={`getPokemon-${tool.toolCallId}-generating`}
                      className="animate-pulse"
                    >
                      Calling <code>{tool.toolName}</code> MCP server...
                    </div>
                  ))
                  .with(
                    { toolName: 'getWeatherInformation', state: 'call' },
                    (tool) => (
                      <div
                        key={`getWeatherInformation-${tool.toolCallId}-content-${tool.args.city}`}
                        className="flex flex-col gap-2"
                      >
                        <Disclosure>
                          <DisclosureTrigger>
                            Run <code>{tool.toolName}</code> tool with args:
                          </DisclosureTrigger>
                          <DisclosurePanel>
                            {JSON.stringify(tool.args, null, 2)}
                          </DisclosurePanel>
                        </Disclosure>

                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              // will trigger a call to route handler.
                              addToolResult({
                                toolCallId: tool.toolCallId,
                                result: APPROVAL.YES,
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            appearance="outline"
                            intent="outline"
                            onClick={() =>
                              // will trigger a call to route handler.
                              addToolResult({
                                toolCallId: tool.toolCallId,
                                result: APPROVAL.NO,
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )
                  )
                  .with({ toolName: 'deepResearch' }, (tool) => (
                    <ChatMessageDeepResearch
                      toolInvocation={tool}
                      annotations={message.annotations}
                    />
                  ))
                  .with(
                    { toolName: 'webSearch', state: P.not('result') },
                    () => (
                      <motion.div
                        className="animate-pulse bg-zinc-50 p-2 font-mono text-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
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
