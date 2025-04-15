import { I18N_COOKIE_NAME, I18N_DEFAULT_LOCALE } from '@/core/constants/i18n';
import type { Formats, Locale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import 'server-only';

export const formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
} satisfies Formats;

export default getRequestConfig(async () => {
  const cookie = await cookies();
  const locale = (cookie.get(I18N_COOKIE_NAME)?.value ||
    I18N_DEFAULT_LOCALE) as Locale;

  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});
