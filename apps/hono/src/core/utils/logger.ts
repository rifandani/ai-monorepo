import {
  type AnyValue,
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
import { SERVICE_NAME, SERVICE_VERSION } from '@/core/constants/global.js';

const COLOR = {
  RED: '\x1B[31m',
  YELLOW: '\x1B[33m',
  GREEN: '\x1B[32m',
  BLUE: '\x1B[34m',
  WHITE: '\x1B[37m',
};

const LEVEL_COLORS = {
  FATAL: COLOR.RED,
  ERROR: COLOR.RED,
  WARN: COLOR.YELLOW,
  INFO: COLOR.BLUE,
  DEBUG: COLOR.GREEN,
  TRACE: COLOR.WHITE,
};

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

export class Logger {
  context: AnyValue;
  logger: ApiLogsLogger;

  /**
   * @param context - The context of the logger. It will be passed into the attributes of the log record.
   */
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

    this.logger = loggerProvider.getLogger('default', '1.0.0');
  }

  log(message: string, attributes?: AnyValueMap) {
    const severity = 'INFO';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    this.logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: severity,
      body: message,
      attributes: {
        context: this.context,
        ...attributes,
      },
    });

    console.log(
      `${severityColor}[${timeFormatted}] ${severityColor}[${this.context}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`
      // attributes
    );
  }

  warn(message: string, attributes?: AnyValueMap) {
    const severity = 'WARN';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    this.logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: severity,
      body: message,
      attributes: {
        context: this.context,
        ...attributes,
      },
    });

    console.warn(
      `${severityColor}[${timeFormatted}] ${severityColor}[${this.context}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`
      // attributes
    );
  }

  error(message: string, attributes?: AnyValueMap) {
    const severity = 'ERROR';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    this.logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: severity,
      body: message,
      attributes: {
        context: this.context,
        ...attributes,
      },
    });

    console.error(
      `${severityColor}[${timeFormatted}] ${severityColor}[${this.context}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`
      // attributes
    );
  }
}
