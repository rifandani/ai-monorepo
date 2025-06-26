import { LogLevel, MastraLogger } from '@mastra/core/logger';
import {
  type AnyValueMap,
  type Logger as ApiLogsLogger,
  SeverityNumber,
} from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
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
import { logger } from '@workspace/core/utils/logger';
import { SERVICE_NAME, SERVICE_VERSION } from '@/core/constants/global';

export class OtelLogger extends MastraLogger {
  logger: ApiLogsLogger;
  disableConsoleLog: boolean;

  constructor(
    options: {
      name?: string;
      level?: LogLevel;
    } = {},
    disableConsoleLog = false
  ) {
    super(options);

    // To start a logger, you first need to initialize the Logger provider.
    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
      }),
      // you can use ConsoleLogRecordExporter to log to the console
      processors: [new BatchLogRecordProcessor(new OTLPLogExporter())],
    });

    this.logger = loggerProvider.getLogger('default', '1.0.0');
    this.disableConsoleLog = disableConsoleLog;
  }

  debug(message: string, attributes?: AnyValueMap): void {
    if (this.level === LogLevel.DEBUG) {
      this.logger.emit({
        severityNumber: SeverityNumber.DEBUG,
        severityText: LogLevel.DEBUG,
        body: message,
        attributes,
      });

      if (!this.disableConsoleLog) {
        logger.debug(message, attributes);
      }
    }
  }

  info(message: string, attributes?: AnyValueMap): void {
    if (this.level === LogLevel.INFO || this.level === LogLevel.DEBUG) {
      this.logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: LogLevel.INFO,
        body: message,
        attributes,
      });

      if (!this.disableConsoleLog) {
        logger.log(message, attributes);
      }
    }
  }

  warn(message: string, attributes?: AnyValueMap): void {
    if (
      this.level === LogLevel.WARN ||
      this.level === LogLevel.INFO ||
      this.level === LogLevel.DEBUG
    ) {
      this.logger.emit({
        severityNumber: SeverityNumber.WARN,
        severityText: LogLevel.WARN,
        body: message,
        attributes,
      });

      if (!this.disableConsoleLog) {
        logger.warn(message, attributes);
      }
    }
  }

  error(message: string, attributes?: AnyValueMap): void {
    if (
      this.level === LogLevel.ERROR ||
      this.level === LogLevel.WARN ||
      this.level === LogLevel.INFO ||
      this.level === LogLevel.DEBUG
    ) {
      this.logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: LogLevel.ERROR,
        body: message,
        attributes,
      });

      if (!this.disableConsoleLog) {
        logger.error(message, attributes);
      }
    }
  }

  // biome-ignore lint/suspicious/useAwait: xxx
  async getLogs(
    _transportId: string,
    _params?: {
      fromDate?: Date;
      toDate?: Date;
      logLevel?: LogLevel;
      filters?: Record<string, unknown>;
      page?: number;
      perPage?: number;
    }
  ) {
    return {
      logs: [],
      total: 0,
      page: _params?.page ?? 1,
      perPage: _params?.perPage ?? 100,
      hasMore: false,
    };
  }

  // biome-ignore lint/suspicious/useAwait: xxx
  async getLogsByRunId(_args: {
    transportId: string;
    runId: string;
    fromDate?: Date;
    toDate?: Date;
    logLevel?: LogLevel;
    filters?: Record<string, unknown>;
    page?: number;
    perPage?: number;
  }) {
    return {
      logs: [],
      total: 0,
      page: _args.page ?? 1,
      perPage: _args.perPage ?? 100,
      hasMore: false,
    };
  }
}
