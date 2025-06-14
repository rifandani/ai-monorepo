const COLOR = {
  RED: '\x1B[31m',
  YELLOW: '\x1B[33m',
  BLUE: '\x1B[34m',
  GREEN: '\x1B[32m',
  WHITE: '\x1B[37m',
};

const LEVEL_COLORS = {
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

export const logger = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  debug(message: string, ...attributes: any[]) {
    const severity = 'DEBUG';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.debug(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  log(message: string, ...attributes: any[]) {
    const severity = 'INFO';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    // biome-ignore lint/suspicious/noConsole: <explanation>
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  warn(message: string, ...attributes: any[]) {
    const severity = 'WARN';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.warn(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  error(message: string, ...attributes: any[]) {
    const severity = 'ERROR';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },
};
