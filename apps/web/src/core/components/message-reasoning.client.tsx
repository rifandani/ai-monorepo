'use client';

import { Markdown } from '@/core/components/markdown.client';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

const variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
};

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row items-center gap-2">
          <div className="font-medium">Reasoning</div>
          <div className="animate-spin">
            <Icon icon="eos-icons:bubble-loading" className="size-4" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2">
          <div className="font-medium">Reasoned for a few seconds</div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <Icon icon="lucide:chevron-down" className="size-4" />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="flex flex-col gap-4 border-l pl-4 text-zinc-600 dark:text-zinc-400"
          >
            <Markdown>{reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
