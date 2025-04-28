'use client';

import { TextField } from '@/core/components/ui/text-field';
import { useChat } from '@ai-sdk/react';
import { Icon } from '@iconify/react';
// import { useScrollToBottom } from '@workspace/core/hooks/use-scroll-to-bottom';
import { PreviewMessage } from './message';

export default function Chat() {
  const { messages, input, setInput, handleSubmit, error, status } = useChat({
    api: '/api/deep-research',
    maxSteps: 10,
    onToolCall({ toolCall }) {
      console.log(`🦁 ~ "page.tsx" at line 14: toolCall -> `, toolCall);
    },
    onFinish(message, options) {
      console.log(`🐦 ~ "page.tsx" at line 20: message, options -> `, {
        message,
        options,
      });
    },
  });
  // const [containerRef, endRef] = useScrollToBottom<HTMLDivElement>();

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="stretch mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <div
        className="h-full flex-1 space-y-6 overflow-y-scroll py-12"
        // ref={containerRef}
        data-testid="chat-messages"
      >
        {messages.map((message) => (
          <PreviewMessage
            message={message}
            key={message.id}
            isLoading={status === 'submitted' || status === 'streaming'}
          />
        ))}
        <div
          // ref={endRef}
          className="pb-10"
        />
      </div>

      <form onSubmit={handleSubmit} className="">
        <div className="relative w-full">
          <TextField
            className="my-4 w-full max-w-2xl rounded-xl py-6 pr-12"
            value={input}
            placeholder="Say something..."
            onChange={(val) => setInput(val)}
          />
          <button
            type="submit"
            className="-translate-y-1/2 absolute top-1/2 right-2 rounded-full bg-black p-2 hover:bg-zinc-900"
          >
            <Icon icon="lucide:arrow-right" className="h-4 w-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
