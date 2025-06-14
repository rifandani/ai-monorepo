'use client';

import { ChatField } from '@/core/components/chat-field.client';
import { ChatMessage } from '@/core/components/chat-message.client';
import { Button, Note } from '@/core/components/ui';
import { useChatFieldStore } from '@/core/hooks/use-chat-field';
import { getToolsRequiringConfirmation, tools } from '@/core/services/ai';
import { type Message, useChat } from '@ai-sdk/react';
import {
  StickToBottom,
  StickToBottomContent,
} from '@workspace/core/components/stick-to-bottom.client';
import { logger } from '@workspace/core/utils/logger';
import { type ChatRequestOptions, createIdGenerator } from 'ai';
import { useCallback } from 'react';
import { toast } from 'sonner';

const toolsWithConfirmation = {
  getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
};

export function Chat({
  id,
  initialMessages,
}: { id?: string; initialMessages?: Message[] } = {}) {
  const showSearch = useChatFieldStore((state) => state.showSearch);
  const showDeepResearch = useChatFieldStore((state) => state.showDeepResearch);
  const {
    // data, // custom data from `dataStream.writeData()`
    messages,
    setMessages,
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
        deepResearchMode: showDeepResearch,
      };
    },
    onToolCall({ toolCall }) {
      // useful for running client-side tools that are automatically executed (e.g. render chart/diagram)
      logger.log(`🐦 ~ "page.tsx" at line 10: toolCall -> `, toolCall);
    },
    onFinish(message, options) {
      logger.log(`🐯 ~ "page.tsx" at line 13: message, options -> `, {
        message,
        options,
      });
    },
    onError(error) {
      toast.error(error.message);
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

  // to trim messages and reload from a specific message
  const handleRetry = useCallback(
    async (messageId: string, options?: ChatRequestOptions) => {
      // Find the index of the message with the specified ID
      const messageIndex = messages.findIndex((m) => m.id === messageId);

      if (messageIndex === -1) {
        // If message or preceding user message not found, perform a normal reload
        return await reload(options);
      }

      // Keep messages up to the specified one (usually the assistant message) and the user message just before it.
      const relevantMessages = messages.slice(0, messageIndex);
      const reversedRelevantMessages = [...relevantMessages].reverse();
      const reversedIndex = reversedRelevantMessages.findIndex(
        (m) => m.role === 'user'
      );
      const userMessageIndex =
        reversedIndex !== -1 ? relevantMessages.length - 1 - reversedIndex : -1;

      if (userMessageIndex === -1) {
        // If message or preceding user message not found, perform a normal reload
        return await reload(options);
      }

      // trim messages up to the user message
      const trimmedMessages = messages.slice(0, userMessageIndex + 1);
      setMessages(trimmedMessages);

      // Reload the conversation
      return await reload(options);
    },
    [messages, reload, setMessages]
  );

  const onSubmit = useCallback(
    (evt: { preventDefault: () => void }, files: FileList | null) => {
      handleSubmit(evt, {
        experimental_attachments: files ?? undefined,
      });
    },
    [handleSubmit]
  );

  return (
    <StickToBottom
      resize="smooth"
      initial="smooth"
      data-testid="chat-root"
      data-total-messages={messages.length}
      className="relative flex h-[100dvh] w-full flex-col p-5 data-[total-messages=0]:min-h-dvh data-[total-messages=0]:justify-center data-[total-messages=0]:pt-0"
    >
      <StickToBottomContent className="flex flex-col gap-y-5">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            addToolResult={addToolResult}
            onRetry={handleRetry}
          />
        ))}
      </StickToBottomContent>

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
        isEmptyChat={messages.length === 0}
        status={status}
        input={input}
        setInput={setInput}
        stop={stop}
        disableSubmit={pendingToolCallConfirmation}
        onSubmit={onSubmit}
      />
    </StickToBottom>
  );
}
