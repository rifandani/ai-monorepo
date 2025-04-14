import type { LocaleDict } from '@workspace/core/locales/type'
import { enLocale } from '@workspace/core/locales/en'
import { idLocale } from '@workspace/core/locales/id'

const localeDict: LocaleDict = {
  'en-US': enLocale,
  'id-ID': idLocale,
} as const

export { enLocale, idLocale, localeDict }
