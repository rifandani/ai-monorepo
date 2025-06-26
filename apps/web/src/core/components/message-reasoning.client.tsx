'use client';

import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Markdown } from '@/core/components/markdown.client';

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
            <Icon className="size-4" icon="eos-icons:bubble-loading" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2">
          <div className="font-medium">Reasoned for a few seconds</div>
          <button
            className="cursor-pointer"
            data-testid="message-reasoning-toggle"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
            type="button"
          >
            <Icon className="size-4" icon="lucide:chevron-down" />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            animate="expanded"
            className="flex flex-col gap-4 border-l pl-4 text-zinc-600 dark:text-zinc-400"
            data-testid="message-reasoning"
            exit="collapsed"
            initial="collapsed"
            key="content"
            style={{ overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            variants={variants}
          >
            <Markdown>{reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
