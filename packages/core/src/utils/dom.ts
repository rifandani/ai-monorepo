/**
 * Save a file to the user's device.
 * @param data - The data to save.
 * @param fileName - The name of the file to save.
 */
export function saveFile(data: Blob | MediaSource, fileName: string): void {
  const url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
