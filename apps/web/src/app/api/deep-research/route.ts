import { models, tools } from '@/core/services/ai';
import { type Message, createDataStreamResponse, streamText } from 'ai';

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Message[] };

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: models.flash25,
        messages,
        system:
          'You are a helpful assistant. Do not repeat the results of deepResearch tool calls. You can report (max 2 sentences) that the tool has been used successfully. Do not call multiple tools at once.',
        tools: {
          webSearch: tools.webSearch,
          deepResearch: tools.deepResearch(dataStream),
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}
