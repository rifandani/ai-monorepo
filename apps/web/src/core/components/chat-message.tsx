import { Markdown } from '@/core/components/markdown';
import { Button } from '@/core/components/ui/button';
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from '@/core/components/ui/disclosure';
import type { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { twMerge } from 'tailwind-merge';
import { P, match } from 'ts-pattern';

export function ChatMessage({
  message,
  addToolResult,
}: {
  message: UIMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
}) {
  return (
    <div
      key={message.id}
      data-testid={`message-${message.id}`}
      data-role={message.role}
      className="group/message flex flex-col gap-y-2 whitespace-pre-wrap"
    >
      {message.experimental_attachments?.map((attachment, index) =>
        match(attachment)
          .with(
            { contentType: P.string.startsWith('image/') },
            (attachment) => (
              <img
                key={`attachment-${attachment.name ?? attachment.url}`}
                data-testid={`attachment-${attachment.name ?? attachment.url}`}
                src={attachment.url}
                alt={attachment.name ?? `attachment-${index}`}
                className="ml-auto aspect-square w-60"
              />
            )
          )
          .with({ contentType: 'application/pdf' }, (attachment) => (
            <iframe
              key={`attachment-${attachment.name ?? attachment.url}`}
              data-testid={`attachment-${attachment.name ?? attachment.url}`}
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
              key={`text-${part.text}`}
              data-testid={`text-${part.text}`}
              className={twMerge(
                'flex w-fit flex-col gap-4',
                message.role === 'user' &&
                  'ml-auto rounded-lg bg-secondary px-3 py-2 text-secondary-foreground'
              )}
            >
              <Markdown>{part.text}</Markdown>
            </div>
          ))
          .with({ type: 'tool-invocation' }, (part) => (
            <div
              key={`tool-invocation-${part.toolInvocation.toolCallId}`}
              data-testid={`tool-invocation-${part.toolInvocation.toolCallId}`}
              data-toolname={part.toolInvocation.toolName}
              data-toolstate={part.toolInvocation.state}
              data-toolstep={part.toolInvocation.step}
              data-toolargs={JSON.stringify(part.toolInvocation.args)}
              className={twMerge(
                ['generateImage'].includes(part.toolInvocation.toolName) &&
                  'skeleton'
              )}
            >
              {match(part.toolInvocation)
                .with({ toolName: 'generateImage', state: 'result' }, (tool) =>
                  tool.result.files.map(
                    (file: { base64: string; mimeType: string }) => (
                      <img
                        key={`file-${file.base64}`}
                        src={`data:${file.mimeType};base64,${file.base64}`}
                        alt={tool.args.prompt}
                        height={400}
                        width={400}
                      />
                    )
                  )
                )
                .with({ toolName: 'generateImage', state: 'call' }, (tool) => (
                  <div
                    key={`generateImage-${tool.toolCallId}-generating`}
                    className="animate-pulse"
                  >
                    Generating image...
                  </div>
                ))
                .with({ toolName: 'getPokemon', state: 'result' }, (tool) =>
                  tool.result.content.map(
                    (content: { type: 'text'; text: string }) => (
                      <p
                        key={`getPokemon-${tool.toolCallId}-content-${content.text}`}
                        className={twMerge('flex flex-col gap-2')}
                      >
                        {content.text}
                      </p>
                    )
                  )
                )
                .with({ toolName: 'getPokemon', state: 'call' }, (tool) => (
                  <div
                    key={`getPokemon-${tool.toolCallId}-generating`}
                    className="animate-pulse"
                  >
                    Calling <code>{tool.toolName}</code> MCP server...
                  </div>
                ))
                .with(
                  { toolName: 'getWeatherInformation', state: 'call' },
                  (tool) => (
                    <div
                      key={`getWeatherInformation-${tool.toolCallId}-content-${tool.args.city}`}
                      className="flex flex-col gap-2"
                    >
                      <Disclosure>
                        <DisclosureTrigger>
                          Run <code>{tool.toolName}</code> tool with args:
                        </DisclosureTrigger>
                        <DisclosurePanel>
                          {JSON.stringify(tool.args, null, 2)}
                        </DisclosurePanel>
                      </Disclosure>

                      <div className="flex gap-2">
                        <Button
                          size="square-petite"
                          onClick={() =>
                            // will trigger a call to route handler.
                            addToolResult({
                              toolCallId: tool.toolCallId,
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
                              toolCallId: tool.toolCallId,
                              result: 'NO',
                            })
                          }
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  )
                )
                .otherwise(() => null)}
            </div>
          ))
          .otherwise(() => null)
      )}
    </div>
  );
}
