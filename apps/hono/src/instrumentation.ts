import * as fs from 'node:fs';
import * as path from 'node:path';
import { SERVICE_NAME, SERVICE_VERSION } from '@/core/constants/global';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { type ExportResult, ExportResultCode } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Custom File Span Exporter
class FileSpanExporter implements SpanExporter {
  private traceFile: string;

  constructor() {
    const tracesDir = path.join(process.cwd(), '.traces');
    if (!fs.existsSync(tracesDir)) {
      fs.mkdirSync(tracesDir, { recursive: true });
    }
    this.traceFile = path.join(
      tracesDir,
      `trace-${new Date().toISOString().split('T')[0]}.json`
    );

    // Initialize file with empty array if it doesn't exist
    if (!fs.existsSync(this.traceFile)) {
      fs.writeFileSync(this.traceFile, '[]');
    }
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    try {
      const spanData = spans.map((span) => ({
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        parentSpanId: span.spanContext().spanId,
        name: span.name,
        kind: span.kind,
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        status: span.status,
        attributes: span.attributes,
        events: span.events,
        resource: span.resource.attributes,
      }));

      const traceEntry = {
        timestamp: new Date().toISOString(),
        spans: spanData,
      };

      // Read existing JSON array, append new entry, and write back
      const existingData = fs.readFileSync(this.traceFile, 'utf8');
      const existingArray = JSON.parse(existingData) as (typeof traceEntry)[];
      existingArray.push(traceEntry);

      fs.writeFileSync(this.traceFile, JSON.stringify(existingArray, null, 2));
      resultCallback({ code: ExportResultCode.SUCCESS });
    } catch (error) {
      resultCallback({ code: ExportResultCode.FAILED, error: error as Error });
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed for file exporter
  }
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
  }),
  // new ConsoleSpanExporter(), // or new FileSpanExporter()
  traceExporter: new OTLPTraceExporter(),
  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new OTLPMetricExporter(),
  // }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (request) => {
          return (
            request.url === '/favicon.ico' ||
            request.url === '/openapi' ||
            (request.url?.startsWith('/openapi/') ?? false)
          );
        },
      },
    }),
  ],
});

sdk.start();
console.log('Instrumentation started');
