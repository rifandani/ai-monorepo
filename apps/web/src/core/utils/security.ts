/**
 * Security utility functions for development.
 *
 * This file provides:
 * - Bot detection (using User-Agent heuristics)
 * - Rate limiting (in-memory store with customizable parameters)
 * - Attack protection (basic input sanitization)
 *
 * Customize each function based on your needs.
 */

interface RateLimitOptions {
  limit: number;
  timeframe: number; // timeframe in milliseconds
}

interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

// Simple in-memory rate limit store by IP address.
// NOTE: In production, use a distributed store like Redis.
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Detects if a request might be coming from a bot.
 *
 * @remarks
 * This function uses a simple heuristic on the User-Agent string.
 *
 * @param userAgent - User-Agent string from the HTTP request headers.
 * @returns true if a bot is suspected, false otherwise.
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [/bot/i, /crawl/i, /slurp/i, /spider/i, /mediapartners/i];
  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Rate limits requests by a key (commonly an IP address).
 *
 * @remarks
 * This in-memory example should be replaced with a persistent store in production.
 *
 * @param key - Identifier for the client (e.g. IP address).
 * @param options - Customizable options for the rate limiter.
 * @returns true if the request exceeds the limit, false otherwise.
 */
export function rateLimit(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    // First request from this key
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return false;
  }

  const elapsed = now - record.firstRequest;

  if (elapsed > options.timeframe) {
    // Reset count after timeframe has passed
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return false;
  }

  record.count += 1;
  if (record.count > options.limit) {
    return true;
  }
  rateLimitStore.set(key, record);
  return false;
}

/**
 * Sanitizes input to mitigate common injection attacks.
 *
 * @remarks
 * For forms or any user input, this simple implementation escapes
 * common dangerous characters. Further processing or libraries may be needed
 * for advanced scenarios.
 *
 * @param input - The input string.
 * @returns The sanitized string.
 */
export function sanitizeInput(input: string): string {
  // If running in a browser, use a temporary DOM element to safely escape input.
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Fallback for non-browser environments:
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
  };
  const reg = /[&<>"'/`]/g;
  return input.replace(reg, (match) => map[match] as string);
}
