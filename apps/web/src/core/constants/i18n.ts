export type I18NLocale = (typeof I18N_LOCALES)[number];

export const I18N_COOKIE_NAME = 'NEXT_LOCALE' as const;
export const I18N_DEFAULT_LOCALE = 'en' as const;

export const I18N_LOCALES = ['en', 'id'] as const;
