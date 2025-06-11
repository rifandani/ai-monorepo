import { performance } from 'node:perf_hooks';
import { ValueType, metrics } from '@opentelemetry/api';
import type { MiddlewareHandler } from 'hono';

// Create a meter instance for recording metrics
const meter = metrics.getMeter('hono_middleware_meter', '1.0.0');

// Create a histogram to record response times in milliseconds
const responseTimeHistogram = meter.createHistogram(
  'http_request_duration_metric',
  {
    description: 'Duration of HTTP requests in milliseconds',
    unit: 'ms',
    valueType: ValueType.INT,
  }
);

// Create a counter for total requests
const requestCounter = meter.createCounter('http_requests_total_metric', {
  description: 'Total number of HTTP requests',
});

/**
 * Middleware to record HTTP request metrics using OpenTelemetry.
 * Records response time, request count, and labels them with method, route, and status code.
 *
 * - http_request_duration_metric: Histogram of request response times in milliseconds
 * - http_requests_total_metric: Counter of total HTTP requests
 *
 * Both metrics include labels for:
 * - method: HTTP method (GET, POST, etc.)
 * - route: Request route/path
 * - status_code: HTTP status code (200, 404, etc.)
 * - status_class: Status code class (2xx, 4xx, etc.)
 *
 * Usage:
 * ```ts
 * import { metricsMiddleware } from '@/routes/middleware/metrics';
 *
 * app.use('*', metricsMiddleware());
 * ```
 */
export function metricsMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const startTime = performance.now();

    // Get request information
    const method = c.req.method;
    const route = c.req.routePath || c.req.path;

    // Increment request counter
    requestCounter.add(1, {
      method,
      route,
    });

    try {
      await next();
    } finally {
      // Calculate response time
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Get response status
      const status = c.res.status.toString();
      const statusClass = `${Math.floor(c.res.status / 100)}xx`;

      // Record response time histogram
      responseTimeHistogram.record(responseTime, {
        method,
        route,
        status_code: status,
        status_class: statusClass,
      });
    }
  };
}
