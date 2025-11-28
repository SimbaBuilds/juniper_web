/**
 * Sanitizes a filename to prevent path traversal attacks
 *
 * Removes:
 * - Path traversal sequences (../, ..\, ./, .\)
 * - Directory separators (/, \)
 * - Null bytes (\0, %00)
 * - Leading dots
 * - Leading/trailing spaces
 *
 * @param filename - The original filename to sanitize
 * @returns A sanitized filename safe for storage
 *
 * @example
 * sanitizeFilename('../../../etc/passwd') // Returns 'etcpasswd'
 * sanitizeFilename('my/file\\name.pdf') // Returns 'my_file_name.pdf'
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal sequences and separators
  let sanitized = filename
    .replace(/\.\./g, '')           // Remove ..
    .replace(/[\/\\]/g, '_')        // Replace / and \ with underscore
    .replace(/\0|%00/g, '')         // Remove null bytes
    .replace(/^\.+/, '')            // Remove leading dots
    .trim();                        // Remove leading/trailing spaces

  // If nothing left, use timestamp-based fallback
  if (!sanitized) {
    sanitized = `file_${Date.now()}`;
  }

  return sanitized;
}
