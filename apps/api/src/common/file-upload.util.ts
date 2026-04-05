/**
 * Centralised file-upload helpers.
 *
 * Using MIME type to select the file extension (instead of `extname(file.originalname)`)
 * prevents two attack vectors:
 *  1. Extension spoofing – attacker supplies `Content-Type: image/jpeg` but names the
 *     file `exploit.html`, causing it to be stored as a `.html` file and served as HTML.
 *  2. SVG/XML XSS – SVG files are technically `image/*` but can embed JavaScript.
 */

/** Safe raster/video image MIME types. SVG is intentionally excluded. */
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
])

/** Image types + common document types accepted for verification uploads. */
export const ALLOWED_DOCUMENT_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

/**
 * Returns the file extension for a given MIME type.
 * Falls back to `.bin` so the filename is never derived from user input.
 */
export function mimeToExt(mime: string): string {
  return MIME_TO_EXT[mime] ?? '.bin'
}
