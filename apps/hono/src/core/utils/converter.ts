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

/**
 * Converts a File object to a data URI.
 *
 * @param file The File object to convert.
 * @returns A data URI representing the file.
 * @example
 * ```typescript
 * const file = new File([], 'example.txt', { type: 'text/plain' });
 * const dataUri = await fileToDataUri(file);
 * console.log(dataUri);
 * ```
 */
export async function fileToDataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Convert ArrayBuffer to Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);
  // Convert Uint8Array to binary string
  let binaryString = '';
  // Avoid potential stack overflow issues with String.fromCharCode.apply for large arrays
  for (const byte of uint8Array) {
    binaryString += String.fromCharCode(byte);
  }
  // Encode binary string to base64
  const base64String = btoa(binaryString);
  const mimeType = file.type || 'application/octet-stream'; // Default MIME type
  return `data:${mimeType};base64,${base64String}`;
}
