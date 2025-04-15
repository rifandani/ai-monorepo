import type { enLocale } from '@workspace/core/locales/index';

export type LocaleDictLanguage = 'en-US' | 'id-ID';
export type LocaleDict = Record<LocaleDictLanguage, Record<string, string>>;

export type Translations = typeof enLocale;
export type InterpolateInner<
  S extends string,
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  U extends object = {},
> = S extends `${string}{${infer V}}${infer Rest}`
  ? InterpolateInner<Rest, U & { [key in V]: string }>
  : U;

export type Interpolate<S extends keyof Translations> = InterpolateInner<
  Translations[S]
>;

export type Formatter = <
  T extends keyof Translations,
  Payload = Interpolate<T>,
>(
  ...args: keyof Payload extends never
    ? [translation: T]
    : [translation: T, payload: Interpolate<T>]
) => string;
