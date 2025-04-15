/**
 * "internationalized/date" library get our locale timezone using `Intl.DateTimeFormat().resolvedOptions()`.
 * In Chrome 118, the `timeZone` will return `undefined` which will cause the library to throw errors.
 * Might need polyfill in react native.
 */
export const RESOLVED_DATE_TIME_FORMAT_OPTIONS = Intl.DateTimeFormat('id-ID', {
  timeZone: 'GMT', // Asia/Jakarta
}).resolvedOptions();
