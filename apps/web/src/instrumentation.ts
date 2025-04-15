import { registerOTel } from '@vercel/otel';
import type { Instrumentation } from 'next';

/**
 * Instrumentation is the process of using code to integrate monitoring and logging tools into your application.
 * This allows you to track the performance and behavior of your application, and to debug issues in production.
 */
export function register() {
  // process.env.NEXT_RUNTIME
  registerOTel({ serviceName: '@workspace/web' });
}

/**
 * track server errors to any custom observability provider.
 */
export const onRequestError: Instrumentation.onRequestError = async () => {
  // process.env.NEXT_RUNTIME
};
