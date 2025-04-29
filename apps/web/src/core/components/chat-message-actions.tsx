'use client';

import { buttonStyles } from '@/core/components/ui/button';
import { Tooltip } from '@/core/components/ui/tooltip';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ChatMessageActions({
  text,
}: {
  text: string;
}) {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <Tooltip.Trigger
          aria-label="Copy message"
          className={buttonStyles({
            intent: 'outline',
            size: 'square-petite',
            shape: 'circle',
          })}
          onClick={async () => {
            setIsCopied(true);
            await navigator.clipboard.writeText(text);
            toast.success('Message copied to clipboard');

            setTimeout(() => {
              setIsCopied(false);
            }, 1000); // Reset after 1 second
          }}
        >
          <Icon
            icon={isCopied ? 'lucide:check' : 'lucide:copy'}
            className="h-4 w-4"
          />
        </Tooltip.Trigger>
        <Tooltip.Content intent="inverse">Copy message</Tooltip.Content>
      </Tooltip>
      {/* {enableShare && chatId && <ChatShare chatId={chatId} />} */}
    </div>
  );
}
