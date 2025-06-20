import { flattenAttributes } from '@/core/utils/object';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { SpanKind, trace } from '@opentelemetry/api';
import {
  ATTR_HTTP_REQUEST_HEADER,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_URL_FULL,
} from '@opentelemetry/semantic-conventions';
import { createProviderRegistry } from 'ai';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

export const mockUserSchema = z.object({
  name: z.string().describe('Name of the person').openapi({
    description: 'Name of the person',
  }),
  age: z.number().describe('Age of the person').openapi({
    description: 'Age of the person',
  }),
  address: z.object({
    street: z.string().describe('Street address of the person').openapi({
      description: 'Street address of the person',
    }),
    city: z.string().describe('City address of the person').openapi({
      description: 'City address of the person',
    }),
    state: z.string().describe('State address of the person').openapi({
      description: 'State address of the person',
    }),
    zip: z.string().describe('Zip code address of the person').openapi({
      description: 'Zip code address of the person',
    }),
  }),
});
export const gofoodSchema = z.object({
  orderId: z.string().describe('Order ID').openapi({
    description: 'Order ID',
  }),
  username: z.string().describe('Name of the person').openapi({
    description: 'Name of the person',
  }),
  totalCost: z.number().describe('Total cost of the order').openapi({
    description: 'Total cost of the order',
  }),
  items: z.array(
    z.object({
      name: z.string().describe('Name of the item ordered').openapi({
        description: 'Name of the item ordered',
      }),
      price: z.number().describe('Price of the item').openapi({
        description: 'Price of the item',
      }),
    })
  ),
  discount: z.number().describe('Discount of the order').openapi({
    description: 'Discount of the order',
  }),
  shippingCost: z.number().describe('Shipping cost of the order').openapi({
    description: 'Shipping cost of the order',
  }),
  deliveryAddress: z.object({
    street: z.string().describe('Street address of the person').openapi({
      description: 'Street address of the person',
    }),
    city: z.string().describe('City address of the person').openapi({
      description: 'City address of the person',
    }),
    state: z.string().describe('State address of the person').openapi({
      description: 'State address of the person',
    }),
    zip: z.string().describe('Zip code address of the person').openapi({
      description: 'Zip code address of the person',
    }),
  }),
});
export const qualityMetricsSchema = z.object({
  hasCallToAction: z
    .boolean()
    .describe('Whether the copy has a call to action')
    .openapi({
      example: true,
    }),
  emotionalAppeal: z
    .number()
    .min(1)
    .max(10)
    .describe('Emotional appeal of the copy')
    .openapi({
      example: 7,
    }),
  clarity: z.number().min(1).max(10).describe('Clarity of the copy').openapi({
    example: 7,
  }),
});
export const reviewCodeSchema = z.object({
  issues: z.array(z.string().describe('Issues found in the code')),
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('Risk level of the issues'),
  suggestions: z.array(z.string().describe('Suggestions to fix the issues')),
});
export const implementationPlanFileSchema = z.object({
  purpose: z.string().describe('Purpose of the file'),
  filePath: z.string().describe('File path'),
  changeType: z.enum(['create', 'modify', 'delete']).describe('Type of change'),
});
export const implementationPlanImplementationSchema = z.object({
  explanation: z.string().describe('Explanation of the implementation changes'),
  code: z.string().describe('Code of the implementation change'),
});
export const implementationPlanSchema = z.object({
  files: z.array(implementationPlanFileSchema),
  estimatedComplexity: z
    .enum(['low', 'medium', 'high'])
    .describe('Estimated complexity of the implementation'),
});

export const promptSchema = z.string().openapi({
  example: 'What is the capital of France?',
});
export const modelSchema = z.string().openapi({
  example: 'phi4-mini:3.8b',
});
export const systemSchema = z.string().openapi({
  example: 'Before answering, think step by step.',
});
export const textSchema = z.string().openapi({
  example: 'The capital of France is Paris',
});
export const embeddingsSchema = z.array(z.array(z.number())).openapi({
  example: [
    [0.111, 0.222, 0.333],
    [0.444, 0.555, 0.666],
  ],
});
export const reasoningDetailSchema = z.union([
  z.literal('type'),
  z.literal('text'),
]);
export const usageSchema = z.object({
  promptTokens: z.number().openapi({
    example: 10,
  }),
  completionTokens: z.number().openapi({
    example: 10,
  }),
  totalTokens: z.number().openapi({
    example: 20,
  }),
});
export const fileSchema = z.object({
  mimeType: z.string().describe('Mime type of the file').openapi({
    example: 'image/png',
  }),
  base64: z.string().describe('Base64 encoded data of the file').openapi({
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
  }),
});
export const embeddingSchema = z
  .array(z.number())
  .describe(
    'An embedding is a vector, i.e. an array of numbers. It is e.g. used to represent a text as a vector of word embeddings.'
  )
  .openapi({
    example: [0.111, 0.222, 0.333],
  });
export const embeddingUsageSchema = z.object({
  tokens: z
    .number()
    .nullable()
    .describe('The number of tokens used in the embedding.')
    .openapi({
      example: 10,
    }),
});
const cachedContentSchema = z.object({
  name: z.string().describe('Name of the cached content').openapi({
    description: 'Name of the cached content',
  }),
  /**
   * protobuf.Duration format (ex. "3.0001s").
   */
  ttl: z.string().describe('TTL of the cached content').openapi({
    example: '3.0001s',
  }),
  /**
   * `CachedContent` creation time in ISO string format.
   */
  createTime: z
    .string()
    .describe('Creation time of the cached content')
    .openapi({
      example: '2021-01-01T00:00:00.000Z',
    }),
  /**
   * `CachedContent` update time in ISO string format.
   */
  updateTime: z.string().describe('Update time of the cached content').openapi({
    example: '2021-01-01T00:00:00.000Z',
  }),
});
export const cacheListSchema = z.object({
  cachedContents: z
    .array(cachedContentSchema)
    .describe('Cached contents')
    .openapi({
      description: 'Cached contents',
    }),
  nextPageToken: z.string().describe('Next page token').openapi({
    description: 'Next page token',
  }),
});

/**
 * ================================
 * Registry Providers
 * ================================
 */

export const registry = createProviderRegistry({
  // register provider with prefix and default setup
  // by default use process.env.GOOGLE_GENERATIVE_AI_API_KEY
  google: createGoogleGenerativeAI(),
});

const tracerProvider = trace.getTracerProvider();
const tracer = tracerProvider.getTracer('gemini.sdk', '1.0.0');

// by default use GOOGLE_GENERATIVE_AI_API_KEY
// example fetch wrapper that logs the input to the API call:
const google = createGoogleGenerativeAI({
  // @ts-expect-error preconnect is bun specific
  fetch: (
    url: Parameters<typeof fetch>[0],
    options: Parameters<typeof fetch>[1]
  ) => {
    return tracer.startActiveSpan(
      'createGoogleGenerativeAI.fetch',
      {
        kind: SpanKind.CLIENT,
        attributes: {
          [ATTR_HTTP_REQUEST_METHOD]: options?.method,
          [ATTR_URL_FULL]: url.toString(),
        },
      },
      async (span) => {
        for (const [name, value] of Object.entries(options?.headers ?? {})) {
          span.setAttribute(ATTR_HTTP_REQUEST_HEADER(name), value);
        }

        // Handle body properly - parse JSON string if needed
        if (options?.body) {
          try {
            const bodyData =
              typeof options.body === 'string'
                ? JSON.parse(options.body)
                : options.body;

            const flattenedBody = flattenAttributes(bodyData, {
              prefix: 'http.request.body',
            });
            for (const [key, value] of Object.entries(flattenedBody)) {
              span.setAttribute(key, value);
            }
          } catch {
            // If JSON parsing fails, just set the raw body
            span.setAttribute('http.request.body', String(options.body));
          }
        }

        span.updateName(`${options?.method} ${url}`);
        span.end();
        return await fetch(url, options);
      }
    );
  },
});

const flash20 = google('gemini-2.0-flash-001');
/**
 * only one that supports generating images
 */
const flash20exp = google('gemini-2.0-flash-exp');
const flash20search = google('gemini-2.0-flash-001', {
  // don't use dynamic retrieval, it's only for 1.5 models and old-fashioned
  useSearchGrounding: true,
});
const flash20safety = google('gemini-2.0-flash-001', {
  // https://ai.google.dev/gemini-api/docs/safety-settings?hl=en
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
  ],
});
/**
 * Implicit caching is enabled on Gemini 2.5 models by default.
 * If a request contains content that is a cache hit, they automatically pass the cost savings back to us.
 */
const flash25 = google('gemini-2.5-flash-preview-05-20'); // previously 04-17
const flash25search = google('gemini-2.5-flash-preview-05-20', {
  useSearchGrounding: true,
});
/**
 * pro-exp is no longer free as of 3 June 2025
 */
// const pro25 = google('gemini-2.5-pro-exp-05-06');
/**
 * Input token limit: 2,048
 * Output dimension size: 768
 */
const embedding004 = google.textEmbeddingModel('text-embedding-004');
/**
 * Input token limit: 8,192
 * Output dimension size: Elastic, supports: 3072, 1536, or 768
 */
const geminiEmbedding = google.textEmbeddingModel('gemini-embedding-exp-03-07');

export const cacheManager = new GoogleAICacheManager(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY as string
);
// As of Apr 28rd, 2025, only models that support caching in free tier
type GoogleModelCacheableId =
  | 'models/gemini-1.5-flash-001'
  | 'models/gemini-1.5-pro-001'
  | 'models/gemini-2.0-flash-001';
export const cacheModelId: GoogleModelCacheableId =
  'models/gemini-1.5-flash-001';

export const models = {
  flash20,
  flash20exp,
  flash20search,
  flash20safety,
  flash25,
  // flash25safety, // not supported as of 5 June 2025
  flash25search,
  // pro25,
  embedding004,
  geminiEmbedding,
};
