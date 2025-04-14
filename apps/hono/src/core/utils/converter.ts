/**
 * Converts a base64 encoded string to a Uint8Array.
 * Handles URL-safe base64 encoding by replacing '-' with '+' and '_' with '/'.
 * Adds necessary padding if missing.
 *
 * @param base64String The base64 encoded string to convert.
 * @returns A Uint8Array representing the decoded data.
 * @example
 * ```typescript
 * const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAUA..."; // truncated base64 string
 * const imageBytes = base64ToUint8Array(base64Image);
 * const blob = new Blob([uint8Array], { type: file.mimeType });
 * ```
 */
export function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
