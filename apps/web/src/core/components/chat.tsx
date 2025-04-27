'use client';

import { Markdown } from '@/app/deep-research/markdown';
import { ChatField } from '@/core/components/chat-field';
import {
  Button,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  Note,
} from '@/core/components/ui';
import { getToolsRequiringConfirmation, tools } from '@/core/services/ai';
import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { twMerge } from 'tailwind-merge';
import { P, match } from 'ts-pattern';

const toolsWithConfirmation = {
  getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
};

export function Chat({
  id,
  initialMessages,
}: { id?: string; initialMessages?: Message[] } = {}) {
  const {
    // data, // custom data from `dataStream.writeData()`
    messages,
    input,
    setInput,
    handleSubmit,
    status,
    stop,
    addToolResult,
    error,
    reload,
  } = useChat({
    /**
     * The chat state is shared between both components by using the same `id` value.
     * This allows you to split the form and chat messages into separate components while maintaining synchronized state.
     */
    id,
    // id format for client-side messages
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),
    initialMessages, // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message, meaning that we store messages in the useChat message format.
    api: '/api/chat',
    maxSteps: 10,
    experimental_prepareRequestBody({ messages, id }) {
      // useful for example, only send the last message, send additional data along with the message, change the structure of the request body
      // biome-ignore lint/nursery/useAtIndex: <explanation>
      return { message: messages[messages.length - 1], id };
    },
    // experimental_throttle: 50, // throttle messages and data updates to 50ms
    onToolCall({ toolCall }) {
      // useful for running client-side tools that are automatically executed (e.g. render chart/diagram)
      console.log(`🐦 ~ "page.tsx" at line 10: toolCall -> `, toolCall);
    },
    onFinish(message, options) {
      console.log(`🐯 ~ "page.tsx" at line 13: message, options -> `, {
        message,
        options,
      });
    },
  });

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(
    toolsWithConfirmation
  );
  // used to disable input while confirmation is pending
  const pendingToolCallConfirmation = messages.some((msg: Message) =>
    msg.parts?.some(
      (part) =>
        part.type === 'tool-invocation' &&
        part.toolInvocation.state === 'call' &&
        toolsRequiringConfirmation.includes(part.toolInvocation.toolName)
    )
  );

  return (
    <main
      data-total-messages={messages.length}
      className="stretch mx-auto flex w-full max-w-lg flex-col pt-10 data-[total-messages=0]:min-h-dvh data-[total-messages=0]:justify-center data-[total-messages=0]:pt-0"
    >
      <div className="flex flex-col gap-y-5">
        {messages.map((message) => (
          <div
            key={message.id}
            data-testid={`message-${message.id}`}
            data-role={message.role}
            className="group/message whitespace-pre-wrap"
          >
            <p className="font-bold group-data-[role=user]/message:text-right">
              {message.role}
            </p>

            {message.experimental_attachments?.map((attachment, index) =>
              match(attachment)
                .with(
                  { contentType: P.string.startsWith('image/') },
                  (attachment) => (
                    <img
                      key={`message-${message.id}-attachment-${attachment.name ?? attachment.url}`}
                      src={attachment.url}
                      alt={attachment.name ?? `attachment-${index}`}
                      width={400}
                      height={400}
                    />
                  )
                )
                .with({ contentType: 'application/pdf' }, (attachment) => (
                  <iframe
                    key={`message-${message.id}-attachment-${attachment.name ?? attachment.url}`}
                    src={attachment.url}
                    title={attachment.name ?? `attachment-${index}`}
                    width="400"
                    height="400"
                  />
                ))
                .otherwise(() => null)
            )}

            {message.parts?.map((part) =>
              match(part)
                .with({ type: 'text' }, (part) => (
                  <div
                    key={`message-${message.id}-text-${part.text}`}
                    className={twMerge(
                      'flex w-fit flex-col gap-4',
                      message.role === 'user' &&
                        'ml-auto rounded-lg bg-primary px-3 py-2 text-primary-foreground'
                    )}
                  >
                    <Markdown>{part.text}</Markdown>
                  </div>
                ))
                .with({ type: 'tool-invocation' }, (part) => (
                  <div
                    key={`message-${message.id}-toolcall-${part.toolInvocation.toolCallId}`}
                    data-testid={`toolcallid-${part.toolInvocation.toolCallId}`}
                    data-toolname={part.toolInvocation.toolName}
                    data-toolstate={part.toolInvocation.state}
                    data-toolstep={part.toolInvocation.step}
                    data-toolargs={JSON.stringify(part.toolInvocation.args)}
                    className={twMerge(
                      ['generateImage'].includes(
                        part.toolInvocation.toolName
                      ) && 'skeleton'
                    )}
                  >
                    {match(part.toolInvocation.toolName)
                      .with('generateImage', () =>
                        part.toolInvocation.state === 'result' ? (
                          part.toolInvocation.result.files.map(
                            (file: { base64: string; mimeType: string }) => (
                              <img
                                key={`message-${message.id}-toolcall-${part.toolInvocation.toolCallId}-file-${file.base64}`}
                                src={`data:${file.mimeType};base64,${file.base64}`}
                                alt={part.toolInvocation.args.prompt}
                                height={400}
                                width={400}
                              />
                            )
                          )
                        ) : (
                          <div
                            key={`message-${message.id}-toolcall-${part.toolInvocation.toolCallId}-generating`}
                            className="animate-pulse"
                          >
                            Generating image...
                          </div>
                        )
                      )
                      .with('get-pokemon', () =>
                        part.toolInvocation.state === 'result' ? (
                          part.toolInvocation.result.content.map(
                            (content: { type: 'text'; text: string }) => (
                              <p
                                key={`message-${message.id}-toolcall-${part.toolInvocation.toolCallId}-content-${content.text}`}
                                className={twMerge('flex flex-col gap-4')}
                              >
                                {content.text}
                              </p>
                            )
                          )
                        ) : (
                          <div
                            key={`message-${message.id}-toolcall-${part.toolInvocation.toolCallId}-generating`}
                            className="animate-pulse"
                          >
                            Calling <code>{part.toolInvocation.toolName}</code>{' '}
                            MCP server...
                          </div>
                        )
                      )
                      .with('getWeatherInformation', () =>
                        part.toolInvocation.state === 'call' ? (
                          <div
                            key={`message-${message.id}-toolcall-${part.toolInvocation.toolCallId}-content-${part.toolInvocation.args.city}`}
                            className="flex flex-col gap-2"
                          >
                            <Disclosure>
                              <DisclosureTrigger>
                                Run <code>{part.toolInvocation.toolName}</code>{' '}
                                tool with args:
                              </DisclosureTrigger>
                              <DisclosurePanel>
                                {JSON.stringify(
                                  part.toolInvocation.args,
                                  null,
                                  2
                                )}
                              </DisclosurePanel>
                            </Disclosure>

                            <div className="flex gap-2">
                              <Button
                                size="square-petite"
                                onClick={() =>
                                  // will trigger a call to route handler.
                                  addToolResult({
                                    toolCallId: part.toolInvocation.toolCallId,
                                    result: 'YES',
                                  })
                                }
                              >
                                Yes
                              </Button>
                              <Button
                                size="square-petite"
                                appearance="outline"
                                intent="outline"
                                onClick={() =>
                                  // will trigger a call to route handler.
                                  addToolResult({
                                    toolCallId: part.toolInvocation.toolCallId,
                                    result: 'NO',
                                  })
                                }
                              >
                                No
                              </Button>
                            </div>
                          </div>
                        ) : null
                      )
                      .otherwise(() => null)}
                  </div>
                ))
                .otherwise(() => null)
            )}
          </div>
        ))}
      </div>

      {/* reflects the error object thrown during the fetch request, show generic error message to avoid leaking information from the server */}
      {error && (
        <span className="mt-2 flex items-center gap-2">
          <Note intent="danger">An error occurred.</Note>
          <Button
            type="button"
            intent="outline"
            size="small"
            onClick={() => reload()}
          >
            Retry
          </Button>
        </span>
      )}

      <ChatField
        status={status}
        input={input}
        setInput={setInput}
        stop={stop}
        disableSubmit={pendingToolCallConfirmation}
        onSubmit={(evt, files) => {
          handleSubmit(evt, {
            experimental_attachments: files ?? undefined,
          });
        }}
      />
    </main>
  );
}
