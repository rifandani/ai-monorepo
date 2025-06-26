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
  // biome-ignore lint/suspicious/noExplicitAny: xxx
  debug(message: string, ...attributes: any[]) {
    const severity = 'DEBUG';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    console.debug(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },

  // biome-ignore lint/suspicious/noExplicitAny: xxx
  log(message: string, ...attributes: any[]) {
    const severity = 'INFO';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    console.log(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },

  // biome-ignore lint/suspicious/noExplicitAny: xxx
  warn(message: string, ...attributes: any[]) {
    const severity = 'WARN';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    console.warn(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },

  // biome-ignore lint/suspicious/noExplicitAny: xxx
  error(message: string, ...attributes: any[]) {
    const severity = 'ERROR';
    const severityColor = LEVEL_COLORS[severity as keyof typeof LEVEL_COLORS];
    const timeFormatted = formatTime(new Date());

    console.error(
      `${severityColor}[${timeFormatted}] ${severityColor}${severity}: ${COLOR.WHITE}${message}`,
      ...attributes
    );
  },
};
