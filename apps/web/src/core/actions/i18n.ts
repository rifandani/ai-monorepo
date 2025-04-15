'use server';

import {
  I18N_COOKIE_NAME,
  I18N_DEFAULT_LOCALE,
  I18N_LOCALES,
} from '@/core/constants/i18n';
import { actionClient } from '@/core/utils/action';
import { cookies } from 'next/headers';
import { z } from 'zod';

const localeSchema = z.enum(I18N_LOCALES);

/**
 * Retrieves the user's preferred locale from cookies
 * @returns {Promise<string>} The user's locale string, or the default I18N_DEFAULT_LOCALE if not set
 */
export const getUserLocaleAction = actionClient
  .metadata({ actionName: 'getUserLocale' })
  .action(async () => {
    // get locale from cookies
    const cookie = await cookies();
    return cookie.get(I18N_COOKIE_NAME)?.value ?? I18N_DEFAULT_LOCALE;
  });

/**
 * Sets the user's preferred locale in cookies
 * @param {I18NLocale} locale - The locale to set for the user
 * @returns {Promise<{ error?: string } | undefined>} An object containing an error message if the locale payload is invalid
 */
export const setUserLocaleAction = actionClient
  .metadata({ actionName: 'setUserLocale' })
  .schema(localeSchema)
  .action(async ({ parsedInput }) => {
    // set locale in cookies
    const cookie = await cookies();
    cookie.set(I18N_COOKIE_NAME, parsedInput);
  });
