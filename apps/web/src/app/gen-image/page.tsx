'use client';

import { Markdown } from '@/app/deep-research/markdown';
import { ChatField } from '@/core/components/chat-field';
import {
  Button,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui';
import { getToolsRequiringConfirmation, tools } from '@/core/services/ai';
import { type Message, useChat } from '@ai-sdk/react';
import { twJoin, twMerge } from 'tailwind-merge';
import { P, match } from 'ts-pattern';

const toolsWithConfirmation = {
  getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
};

export default function Chat() {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    status,
    stop,
    addToolResult,
  } = useChat({
    /**
     * The chat state is shared between both components by using the same `id` value.
     * This allows you to split the form and chat messages into separate components while maintaining synchronized state.
     * e.g. we also use useChat here as well as inside ChatField component with the same `id` value.
     */
    // id: 'gen-image',
    api: '/api/gen-image',
    // experimental_prepareRequestBody(options) {
    //   console.log(`🦛 ~ "page.tsx" at line 12: Whats inside request body? -> `, options);
    // },
    // experimental_throttle: 50, // throttle messages and data updates to 50ms
    onToolCall({ toolCall }) {
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
    <main className="stretch mx-auto flex w-full max-w-lg flex-col pt-12">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            data-testid={`message-${message.id}`}
            data-role={message.role}
            className="whitespace-pre-wrap"
          >
            <p className="font-bold">{message.role}</p>

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
                      'flex flex-col gap-4',
                      message.role === 'user' &&
                        'rounded-xl bg-primary px-3 py-2 text-primary-foreground'
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
                    className={twJoin(
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

      <ChatField
        status={status}
        input={input}
        setInput={setInput}
        stop={stop}
        onSubmit={(evt, files) => {
          handleSubmit(evt, {
            experimental_attachments: files ?? undefined,
          });
        }}
      />
    </main>
  );
}
