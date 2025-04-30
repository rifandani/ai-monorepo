'use client';

import { buttonStyles } from '@/core/components/ui/button';
import { Tooltip } from '@/core/components/ui/tooltip';
import { Icon } from '@iconify/react';
import { useCopyToClipboard } from '@workspace/core/hooks/use-copy-to-clipboard';
import { toast } from 'sonner';

export function ChatMessageActions({
  text,
  onRetry,
}: {
  text: string;
  onRetry: () => void;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className="flex items-center gap-1" data-testid="chat-message-actions">
      <Tooltip>
        <Tooltip.Trigger
          aria-label="Copy message"
          className={buttonStyles({
            intent: 'plain',
            size: 'square-petite',
          })}
          onClick={() => {
            copyToClipboard(text);
            toast.success('Message copied to clipboard');
          }}
        >
          <Icon
            icon={isCopied ? 'lucide:check' : 'lucide:copy'}
            className="h-4 w-4"
          />
        </Tooltip.Trigger>
        <Tooltip.Content intent="inverse">Copy message</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger
          aria-label="Retry"
          className={buttonStyles({
            intent: 'plain',
            size: 'square-petite',
          })}
          onClick={onRetry}
        >
          <Icon icon="lucide:rotate-cw" className="h-4 w-4" />
        </Tooltip.Trigger>
        <Tooltip.Content intent="inverse">Retry</Tooltip.Content>
      </Tooltip>
      {/* {enableShare && chatId && <ChatShare chatId={chatId} />} */}
    </div>
  );
}
