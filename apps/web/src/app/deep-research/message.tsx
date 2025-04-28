'use client';

import { Markdown } from '@/core/components/markdown';
import { Icon } from '@iconify/react';
import type { Message } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { isEqual } from 'radashi';
import { memo } from 'react';
import { twJoin, twMerge } from 'tailwind-merge';
import { DeepResearch } from './deep-research';

const PurePreviewMessage = ({
  message,
}: {
  message: Message;
  isLoading: boolean;
}) => {
  return (
    <AnimatePresence>
      <motion.div
        className="group/message mx-auto w-full max-w-3xl px-4"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-testid={`message-${message.id}`}
        data-role={message.role}
        data-createdat={message.createdAt?.toISOString()}
      >
        <div className="flex w-full gap-4 group-data-[role=user]/message:ml-auto group-data-[role=user]/message:w-fit group-data-[role=user]/message:max-w-2xl">
          {message.role === 'assistant' && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
              <div className="translate-y-px">
                <Icon icon="mdi:sparkles" className="size-4" />
              </div>
            </div>
          )}

          <div className="flex w-full flex-col">
            {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation> */}
            {message.parts?.map((part) => {
              switch (part.type) {
                case 'text':
                  return (
                    <div
                      key={`message-${message.id}`}
                      className="flex w-full flex-row items-start gap-2 pb-4"
                    >
                      <div
                        className={twMerge(
                          'flex flex-col gap-4',
                          message.role === 'user' &&
                            'rounded-xl bg-primary px-3 py-2 text-primary-foreground'
                        )}
                      >
                        <Markdown>{part.text as string}</Markdown>
                      </div>
                    </div>
                  );

                case 'tool-invocation': {
                  const { toolName, toolCallId, state, step } =
                    part.toolInvocation;
                  return (
                    <div
                      key={toolCallId}
                      data-testid={`toolcallid-${toolCallId}`}
                      data-toolname={toolName}
                      data-toolstate={state}
                      data-toolstep={step}
                      data-toolargs={JSON.stringify(part.toolInvocation)}
                      className={twJoin(
                        ['deepResearch'].includes(toolName) && 'skeleton'
                      )}
                    >
                      {toolName === 'deepResearch' ? (
                        <DeepResearch
                          toolInvocation={part.toolInvocation}
                          annotations={message.annotations}
                        />
                      ) : toolName === 'webSearch' ? (
                        state === 'result' ? null : (
                          <motion.div
                            className="animate-pulse bg-zinc-50 p-2 font-mono text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            Searching the web...
                          </motion.div>
                        )
                      ) : null}
                    </div>
                  );
                }

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (
      prevProps.isLoading !== nextProps.isLoading ||
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
  }
);
