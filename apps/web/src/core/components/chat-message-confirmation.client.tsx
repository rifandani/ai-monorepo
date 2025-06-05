import { Button } from '@/core/components/ui/button';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import { APPROVAL } from '@/core/services/ai';
import type { useChat } from '@ai-sdk/react';
import type { ToolInvocation } from 'ai';

export function ChatMessageConfirmation({
  tool,
  addToolResult,
}: {
  tool: ToolInvocation;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
}) {
  return (
    <div
      key={`${tool.toolName}-${tool.toolCallId}-content-${tool.args.city}`}
      className="flex flex-col gap-2"
    >
      <Disclosure>
        <DisclosureTrigger>
          Run <code>{tool.toolName}</code> tool with args:
        </DisclosureTrigger>
        <DisclosurePanel>{JSON.stringify(tool.args, null, 2)}</DisclosurePanel>
      </Disclosure>

      <div className="flex gap-2">
        <Button
          onClick={() =>
            // will trigger a call to route handler.
            addToolResult({
              toolCallId: tool.toolCallId,
              result: APPROVAL.YES,
            })
          }
        >
          Approve
        </Button>
        <Button
          intent="outline"
          onClick={() =>
            // will trigger a call to route handler.
            addToolResult({
              toolCallId: tool.toolCallId,
              result: APPROVAL.NO,
            })
          }
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
