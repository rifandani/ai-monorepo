import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import promptfoo from 'promptfoo';
import type { ApiProvider, ProviderOptions, ProviderResponse } from 'promptfoo';

export default class AiSdkApiProvider implements ApiProvider {
  protected providerId: string;
  config: Record<string, string>;

  constructor(options: ProviderOptions) {
    // The caller may override Provider ID (e.g. when using multiple instances of the same provider)
    this.providerId = options.id || 'AiSdkApiProvider';

    // The config object contains any options passed to the provider in the config file.
    this.config = options.config;
  }

  id(): string {
    return this.providerId;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    console.log('[AiSdkApiProvider]: callApi', {
      prompt,
      providerId: this.providerId,
      config: this.config,
    });
    const cache = await promptfoo.cache.getCache();

    // Create a unique cache key based on the prompt and context
    const cacheKey = `api:${this.providerId}:${prompt}}`; // :${JSON.stringify(context)

    // Check if the response is already cached
    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      console.log('[AiSdkApiProvider]: cachedResponse', { cachedResponse });
      return {
        // Required
        output: cachedResponse,

        // Optional
        tokenUsage: {
          total: 0, // No tokens used because it's from the cache
          prompt: 0,
          completion: 0,
        },

        cached: true,
        cost: 0, // No cost because it's from the cache
      };
    }

    // If not cached, make the function call
    const model = this.config.model || 'gemini-2.5-flash-preview-05-20'; // gemini-2.0-flash-001
    const { text, usage } = await generateText({
      model: google(model),
      prompt,
      maxRetries: 0,
    });
    const inputCost =
      model === 'gemini-2.5-flash-preview-05-20'
        ? 0.15 / 1_000_000
        : 0.1 / 1_000_000; // 2.0 flash
    const outputCost =
      model === 'gemini-2.5-flash-preview-05-20'
        ? 0.6 / 1_000_000
        : 0.025 / 1_000_000; // 2.0 flash
    const totalCost =
      inputCost * usage.promptTokens + outputCost * usage.completionTokens ||
      undefined;

    // Store the response in the cache
    try {
      await cache.set(cacheKey, text);
    } catch (error) {
      console.error(
        '[AiSdkApiProvider]: callApi failed to store response in cache',
        error
      );
    }

    return {
      // Required
      output: text,

      // Optional
      tokenUsage: {
        total: usage.totalTokens,
        prompt: usage.promptTokens,
        completion: usage.completionTokens,
      },

      cached: false,
      cost: totalCost,
    };
  }
}
