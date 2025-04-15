import fs from 'node:fs';
import path from 'node:path';
import { logger } from '@workspace/core/utils/logger';
import {
  type LanguageModelV1,
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

/**
 * When using this caching middleware, keep these points in mind:
 * - Development Only: This approach is intended for local development, not production environments
 * - Cache Invalidation: You'll need to clear the cache (delete the cache file) when you want fresh responses
 * - Multi-Step Flows: When using maxSteps, be aware that caching occurs at the individual language model response level, not across the entire execution flow. This means that while the model's generation is cached, the tool call is not and will run on each generation.
 */
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

export function cached(model: LanguageModelV1) {
  return wrapLanguageModel({
    middleware: cacheMiddleware,
    model,
  });
}
