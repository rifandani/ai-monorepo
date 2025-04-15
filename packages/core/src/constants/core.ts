export type Theme = 'system' | 'light' | 'dark';

export const themes: Theme[] = ['system', 'light', 'dark'];

// object version of `themes`
export const modes = themes.reduce(
  (acc, item) => {
    acc[item] = item;
    return acc;
  },
  {} as Record<Theme, Theme>
);

export const kilobyteMultiplier = 1024;
export const megabyteMultiplier = kilobyteMultiplier * 1024;
export const gigabyteMultiplier = megabyteMultiplier * 1024;

export const indoTimezone = ['WIB', 'WITA', 'WIT'] as const;
