import { SERVICE_NAME, SERVICE_VERSION } from '@/utils/constants';
import {
  type AnyValue,
  type Logger as ApiLogsLogger,
  SeverityNumber,
} from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
  // ConsoleLogRecordExporter
} from '@opentelemetry/sdk-logs';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

export class Logger {
  context: AnyValue;
  logger: ApiLogsLogger;

  constructor(context: AnyValue) {
    this.context = context;

    // To start a logger, you first need to initialize the Logger provider.
    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
      }),
      // you can use ConsoleLogRecordExporter to log to the console
      processors: [new BatchLogRecordProcessor(new OTLPLogExporter())],
    });

    this.logger = loggerProvider.getLogger('default');
  }

  log(message: string) {
    this.logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: message,
      attributes: {
        context: this.context,
      },
    });

    console.log(`[${this.context}] - ${message}`);
  }

  warn(message: string) {
    this.logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: 'WARN',
      body: message,
      attributes: {
        context: this.context,
      },
    });

    console.warn(`[${this.context}] - ${message}`);
  }

  error(message: string) {
    this.logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: message,
      attributes: {
        context: this.context,
      },
    });

    console.error(`[${this.context}] - ${message}`);
  }
}
