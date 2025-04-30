'use client';

import { ChatField } from '@/core/components/chat-field';
import { ChatMessage } from '@/core/components/chat-message';
import { Button, Note } from '@/core/components/ui';
import { getToolsRequiringConfirmation, tools } from '@/core/services/ai';
import { type Message, useChat } from '@ai-sdk/react';
import { useAutoScroll } from '@workspace/core/hooks/use-auto-scroll';
import { createIdGenerator } from 'ai';
import { useState } from 'react';
import { toast } from 'sonner';

const toolsWithConfirmation = {
  getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
};

export function Chat({
  id,
  initialMessages,
}: { id?: string; initialMessages?: Message[] } = {}) {
  const [showSearch, setShowSearch] = useState(false);
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
    experimental_throttle: 100, // throttle messages and data updates to 100ms
    experimental_prepareRequestBody({ messages, id }) {
      // useful for example, only send the last message, send additional data along with the message, change the structure of the request body
      return {
        // biome-ignore lint/nursery/useAtIndex: <explanation>
        message: messages[messages.length - 1],
        id,
        searchMode: showSearch,
      };
    },
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
    onError(error) {
      toast.error(error.message);
    },
  });

  // Manage auto-scroll and user scroll cancel
  const { anchorRef, isAutoScroll } = useAutoScroll({
    isLoading: status === 'submitted' || status === 'streaming',
    dependency: messages.length,
    isStreaming: () => status === 'streaming',
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
    <section
      data-testid="chat-root"
      data-total-messages={messages.length}
      className="stretch mx-auto flex w-full max-w-lg flex-col pt-10 data-[total-messages=0]:min-h-dvh data-[total-messages=0]:justify-center data-[total-messages=0]:pt-0"
    >
      <div className="flex flex-col gap-y-5">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            addToolResult={addToolResult}
          />
        ))}
      </div>

      {/* reflects the error object thrown during the fetch request, show generic error message to avoid leaking information from the server */}
      {error && (
        <span className="mt-2 flex items-center gap-2">
          <Note intent="danger">{error.message}</Note>
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
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        isAutoScroll={isAutoScroll}
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

      <div ref={anchorRef} />
    </section>
  );
}
