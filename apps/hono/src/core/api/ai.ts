import { createGoogleGenerativeAI } from '@ai-sdk/google';
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
  hasCallToAction: z.boolean().openapi({
    example: true,
  }),
  emotionalAppeal: z.number().min(1).max(10).openapi({
    example: 7,
  }),
  clarity: z.number().min(1).max(10).openapi({
    example: 7,
  }),
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
 * Providers
 * ================================
 */

export const registry = createProviderRegistry({
  // register provider with prefix and default setup
  // by default use process.env.GOOGLE_GENERATIVE_AI_API_KEY
  google: createGoogleGenerativeAI(),
});
