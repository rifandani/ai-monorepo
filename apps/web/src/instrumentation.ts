import { DiagLogLevel } from '@opentelemetry/api';
import type { Instrumentation } from 'next';
import { ENV } from '@/core/constants/env';
import { logger } from '@/core/utils/logger';

/**
 * Instrumentation is the process of using code to integrate monitoring and logging tools into your application.
 * This allows you to track the performance and behavior of your application, and to debug issues in production.
 */
export async function register() {
  // we import dynamically because this function could run on edge runtime, and running on edge runtime will not work
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { diag, metrics, DiagConsoleLogger } = await import(
      '@opentelemetry/api'
    );
    const { OTLPLogExporter } = await import(
      '@opentelemetry/exporter-logs-otlp-http'
    );
    const { OTLPMetricExporter } = await import(
      '@opentelemetry/exporter-metrics-otlp-http'
    );
    const {
      envDetector,
      hostDetector,
      osDetector,
      processDetector,
      serviceInstanceIdDetector,
    } = await import('@opentelemetry/resources');
    const { BatchLogRecordProcessor } = await import('@opentelemetry/sdk-logs');
    const { PeriodicExportingMetricReader, MeterProvider } = await import(
      '@opentelemetry/sdk-metrics'
    );
    const { OTLPHttpJsonTraceExporter, registerOTel } = await import(
      '@vercel/otel'
    );
    const { DnsInstrumentation } = await import(
      '@opentelemetry/instrumentation-dns'
    );
    const { HttpInstrumentation } = await import(
      '@opentelemetry/instrumentation-http'
    );
    const { NetInstrumentation } = await import(
      '@opentelemetry/instrumentation-net'
    );
    const { PgInstrumentation } = await import(
      '@opentelemetry/instrumentation-pg'
    );
    const { RuntimeNodeInstrumentation } = await import(
      '@opentelemetry/instrumentation-runtime-node'
    );
    const { UndiciInstrumentation } = await import(
      '@opentelemetry/instrumentation-undici'
    );
    const { resourceFromAttributes } = await import('@opentelemetry/resources');
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
      '@opentelemetry/semantic-conventions'
    );

    const logLevelMap: Record<string, DiagLogLevel> = {
      ALL: DiagLogLevel.ALL,
      VERBOSE: DiagLogLevel.VERBOSE,
      DEBUG: DiagLogLevel.DEBUG,
      INFO: DiagLogLevel.INFO, // default
      WARN: DiagLogLevel.WARN,
      ERROR: DiagLogLevel.ERROR,
      NONE: DiagLogLevel.NONE,
    };

    // for troubleshooting the internal otel logs, set the log level to DEBUG
    diag.setLogger(
      new DiagConsoleLogger(),
      logLevelMap[ENV.NEXT_PUBLIC_OTEL_LOG_LEVEL]
    );

    registerOTel({
      serviceName: ENV.NEXT_PUBLIC_APP_TITLE,
      traceExporter: new OTLPHttpJsonTraceExporter(),
      // doesn't work because the @vercel/otel is using v1.9 and we're using v2.0+, so we need to set the global meter provider manually
      // metricReader: new PeriodicExportingMetricReader({
      //   exporter: new OTLPMetricExporter(),
      // }),
      logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter()),
      resourceDetectors: [
        envDetector,
        hostDetector,
        osDetector,
        serviceInstanceIdDetector,
        processDetector,
      ],
      instrumentations: [
        new DnsInstrumentation(),
        // new FsInstrumentation(), too verbose
        new HttpInstrumentation({
          ignoreIncomingRequestHook: (request) => {
            const openApiRegex = /^\/openapi(?:\/.*)?$/;
            const nextStaticRegex = /^\/_next\/static\/.*/;
            const nextSourceMapRegex = /^\/__nextjs_source-map\//;
            const nextStackFramesRegex = /^\/__nextjs_original-stack-frames\//;
            const wellKnownRegex = /^\/\.well-known\/.*/;
            const imageRegex = /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/i;

            return (
              request.url === '/manifest.webmanifest' ||
              openApiRegex.test(request.url ?? '') ||
              nextStaticRegex.test(request.url ?? '') ||
              nextSourceMapRegex.test(request.url ?? '') ||
              nextStackFramesRegex.test(request.url ?? '') ||
              wellKnownRegex.test(request.url ?? '') ||
              imageRegex.test(request.url ?? '')
            );
          },
        }),
        new NetInstrumentation(),
        new PgInstrumentation({
          enhancedDatabaseReporting: true,
          addSqlCommenterCommentToQueries: true,
        }),
        new RuntimeNodeInstrumentation(),
        new UndiciInstrumentation(),
      ],
    });

    /**
     * set the global meter provider manually
     * downsides are, we can't shutdown gracefully this meter provider
     */
    const meterProvider = new MeterProvider({
      resource: resourceFromAttributes({
        // Node
        'node.ci': process.env.CI ? true : undefined,
        'node.env': process.env.NODE_ENV,

        // Vercel
        // https://vercel.com/docs/projects/environment-variables/system-environment-variables
        // Vercel Env set as top level attribute for simplicity. One of 'production', 'preview' or 'development'.
        env: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV,
        'vercel.region': process.env.VERCEL_REGION,
        'vercel.runtime': 'nodejs',
        'vercel.sha':
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
        'vercel.host':
          process.env.VERCEL_URL ||
          process.env.NEXT_PUBLIC_VERCEL_URL ||
          undefined,
        'vercel.branch_host':
          process.env.VERCEL_BRANCH_URL ||
          process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ||
          undefined,
        'vercel.deployment_id': process.env.VERCEL_DEPLOYMENT_ID || undefined,

        // custom attributes
        [ATTR_SERVICE_NAME]: ENV.NEXT_PUBLIC_APP_TITLE,
        [ATTR_SERVICE_VERSION]: process.env.VERCEL_DEPLOYMENT_ID,
      }),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter(),
        }),
      ],
    });
    metrics.setGlobalMeterProvider(meterProvider);
  }
}

/**
 * track server errors to any custom observability provider.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  errorRequest,
  errorContext
) => {
  logger.error('[onRequestError]: Error', {
    ...(error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          errorCause: error.cause as string,
        }
      : { errorMessage: String(error) }),
    errorRequest,
    errorContext,
  });
};
