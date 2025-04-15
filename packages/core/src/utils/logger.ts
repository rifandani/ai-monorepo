import { pino } from 'pino';

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

/**
 * Server-side logger instance configured with pino.
 * Uses pino-pretty transport for colorized output.
 * Includes environment in base metadata.
 *
 * @env server
 */
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

/**
 * Browser-side logger instance configured with pino.
 * Customized for browser environment with:
 * - Colorized console output
 * - Formatted timestamps
 * - Log level colors matching server logger
 * - Environment metadata
 *
 * @env browser
 */
export const loggerBrowser = pino({
  browser: {
    asObject: true,
    /**
     * Custom log formatter for browser console output
     * @param logObj - The log object containing level, message and timestamp
     */
    write: (logObj) => {
      const { level, msg, time, ...args } = logObj as Record<string, string>;
      const levelUppercased = level?.toUpperCase();
      const date = new Date(time ?? Date.now());
      const timeFormatted = date.toLocaleTimeString(
        navigator.language || 'en-US',
        {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        }
      );
      const LEVEL_COLOR =
        LEVEL_COLORS[levelUppercased as keyof typeof LEVEL_COLORS];

      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.log(
        `${LEVEL_COLOR}[${timeFormatted}] ${LEVEL_COLOR}${levelUppercased}: ${COLOR.WHITE}${msg}`,
        args
      );
    },
    formatters: {
      /**
       * Formats the log level label
       * @param label - The log level string
       * @returns Object containing formatted level
       */
      level: (label) => {
        return {
          level: label,
        };
      },
    },
  },
});
