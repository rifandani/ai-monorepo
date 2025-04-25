import fs from 'node:fs';
import path from 'node:path';
import { logger } from '@workspace/core/utils/logger';
import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1Middleware,
  type LanguageModelV1Prompt,
  type LanguageModelV1StreamPart,
  simulateReadableStream,
  wrapLanguageModel,
} from 'ai';

const CACHE_FILE = path.join(process.cwd(), '.cache/ai-cache.json');

function ensureCacheFile() {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, '{}');
  }
}

function getCachedResult(key: string | object) {
  ensureCacheFile();
  const cacheKey = typeof key === 'object' ? JSON.stringify(key) : key;
  try {
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');

    const cache = JSON.parse(cacheContent);

    const result = cache[cacheKey];

    return result ?? null;
  } catch (error) {
    logger.error(error, 'Cache error: ');
    return null;
  }
}

function updateCache(
  key: string,
  value:
    | Awaited<ReturnType<LanguageModelV1['doGenerate']>>
    | LanguageModelV1StreamPart[]
) {
  ensureCacheFile();
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    const updatedCache = { ...cache, [key]: value };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));
    logger.info(key, 'Cache updated for key:');
  } catch (error) {
    logger.error(error, 'Failed to update cache:');
  }
}

function cleanPrompt(prompt: LanguageModelV1Prompt) {
  return prompt.map((m) => {
    if (m.role === 'assistant') {
      return m.content.map((part) =>
        part.type === 'tool-call' ? { ...part, toolCallId: 'cached' } : part
      );
    }
    if (m.role === 'tool') {
      return m.content.map((tc) => ({
        ...tc,
        toolCallId: 'cached',
        result: {},
      }));
    }

    return m;
  });
}

export const cacheMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify({
      ...cleanPrompt(params.prompt),
      _function: 'generate',
    });
    logger.info(cacheKey, 'Cache Key:');

    const cached = getCachedResult(cacheKey) as Awaited<
      ReturnType<LanguageModelV1['doGenerate']>
    > | null;

    if (cached && cached !== null) {
      logger.info('Cache Hit');
      return {
        ...cached,
        response: {
          ...cached.response,
          timestamp: cached?.response?.timestamp
            ? new Date(cached?.response?.timestamp)
            : undefined,
        },
      };
    }

    logger.info('Cache Miss');
    const result = await doGenerate();

    updateCache(cacheKey, result);

    return result;
  },
  wrapStream: async ({ doStream, params }) => {
    const cacheKey = JSON.stringify({
      ...cleanPrompt(params.prompt),
      _function: 'stream',
    });
    logger.info(cacheKey, 'Cache Key:');

    // Check if the result is in the cache
    const cached = getCachedResult(cacheKey);

    // If cached, return a simulated ReadableStream that yields the cached result
    if (cached && cached !== null) {
      logger.info('Cache Hit');
      // Format the timestamps in the cached response
      const formattedChunks = (cached as LanguageModelV1StreamPart[]).map(
        (p) => {
          if (p.type === 'response-metadata' && p.timestamp) {
            return { ...p, timestamp: new Date(p.timestamp) };
          }

          return p;
        }
      );
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 10,
          chunks: formattedChunks,
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    }

    logger.info('Cache Miss');
    // If not cached, proceed with streaming
    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV1StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // Store the full response in the cache after streaming is complete
        updateCache(cacheKey, fullResponse);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};

/**
 * When using this caching middleware, keep these points in mind:
 * - Development Only: This approach is intended for local development, not production environments
 * - Cache Invalidation: You'll need to clear the cache (delete the cache file) when you want fresh responses
 * - Multi-Step Flows: When using maxSteps, be aware that caching occurs at the individual language model response level, not across the entire execution flow. This means that while the model's generation is cached, the tool call is not and will run on each generation.
 */
export function cached(model: LanguageModelV1) {
  return wrapLanguageModel({
    middleware: cacheMiddleware,
    model,
  });
}

/**
 * Guardrail Middleware
 *
 * This middleware is used to guardrail the model's output.
 * It is used to filter out PII or other sensitive information.
 */
export const guardrailMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate }) => {
    const { text, ...rest } = await doGenerate();

    // filtering approach, e.g. for PII or other sensitive information:
    const cleanedText = text?.replace(/badword/g, '<REDACTED>');

    return { text: cleanedText, ...rest };
  },

  // here you would implement the guardrail logic for streaming
  // Note: streaming guardrails are difficult to implement, because
  // you do not know the full content of the stream until it's finished.
};

export const logMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    logger.info('doGenerate called');
    logger.info(params, 'params:');

    const result = await doGenerate();

    logger.info('doGenerate finished');
    logger.info(result.text, 'generated text:');

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    logger.info('doStream called');
    logger.info(params, 'params:');

    const { stream, ...rest } = await doStream();

    let generatedText = '';

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          generatedText += chunk.textDelta;
        }

        controller.enqueue(chunk);
      },

      flush() {
        logger.info('doStream finished');
        logger.info(generatedText, 'generated text:');
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};

function getLastUserMessageText({
  prompt,
}: {
  prompt: LanguageModelV1Prompt;
}): string | undefined {
  const lastMessage = prompt.at(-1);

  if (lastMessage?.role !== 'user') {
    return undefined;
  }

  return lastMessage.content.length === 0
    ? undefined
    : lastMessage.content.filter((c) => c.type === 'text').join('\n');
}

function addToLastUserMessage({
  text,
  params,
}: {
  text: string;
  params: LanguageModelV1CallOptions;
}): LanguageModelV1CallOptions {
  const { prompt, ...rest } = params;

  const lastMessage = prompt.at(-1);

  if (lastMessage?.role !== 'user') {
    return params;
  }

  return {
    ...rest,
    prompt: [
      ...prompt.slice(0, -1),
      {
        ...lastMessage,
        content: [{ type: 'text', text }, ...lastMessage.content],
      },
    ],
  };
}

// example, could implement anything here:
function findSources(_: { text: string }): Array<{
  title: string;
  previewText: string | undefined;
  url: string | undefined;
}> {
  return [
    {
      title: 'New York',
      previewText: 'New York is a city in the United States.',
      url: 'https://en.wikipedia.org/wiki/New_York',
    },
    {
      title: 'San Francisco',
      previewText: 'San Francisco is a city in the United States.',
      url: 'https://en.wikipedia.org/wiki/San_Francisco',
    },
  ];
}

/**
 * RAG Middleware
 *
 * This middleware is used to add RAG to the model's output.
 */
export const ragMiddleware: LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    const lastUserMessageText = getLastUserMessageText({
      prompt: params.prompt,
    });

    if (lastUserMessageText == null) {
      return params; // do not use RAG (send unmodified parameters)
    }

    const instruction = `Use the following information to answer the question:\n${findSources(
      { text: lastUserMessageText }
    )
      .map((chunk) => JSON.stringify(chunk))
      .join('\n')}`;

    return addToLastUserMessage({ params, text: instruction });
  },
};
