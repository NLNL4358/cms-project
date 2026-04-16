import * as path from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

/**
 * Generate unique filename using UUID to prevent conflicts
 * Format: {uuid}-{timestamp}.{extension}
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const uuid = randomUUID().slice(0, 8); // Short UUID
  return `${uuid}-${timestamp}${ext}`;
}

/**
 * Allowed MIME types for upload
 */
export const ALLOWED_MIME_TYPES = [
  // ─── 이미지 ───
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/vnd.microsoft.icon',

  // ─── 문서 (오피스) ───
  'application/pdf',
  'application/msword',                                                          // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      // .docx
  'application/vnd.ms-excel',                                                    // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',            // .xlsx
  'application/vnd.ms-powerpoint',                                               // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',   // .pptx

  // ─── 문서 (한글) ───
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/vnd.hancom.hwpx',

  // ─── 텍스트 ───
  'text/plain',                 // .txt
  'text/csv',                   // .csv
  'text/html',                  // .html
  'text/css',                   // .css
  'text/xml',                   // .xml
  'application/json',           // .json
  'application/xml',            // .xml
  'text/markdown',              // .md
  'application/rtf',            // .rtf

  // ─── 압축 ───
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-tar',

  // ─── 영상 ───
  'video/mp4',
  'video/mpeg',
  'video/quicktime',            // .mov
  'video/x-msvideo',            // .avi
  'video/webm',
  'video/x-matroska',           // .mkv

  // ─── 오디오 ───
  'audio/mpeg',                 // .mp3
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/webm',

  // ─── 폰트 ───
  'font/woff',
  'font/woff2',
  'font/ttf',
  'font/otf',
  'application/font-woff',
  'application/font-woff2',
];

/**
 * Validate file MIME type
 */
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate filename to prevent path traversal
 */
export function validateFilename(filename: string): void {
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new BadRequestException('Invalid filename: path traversal detected');
  }

  // Check for hidden files
  if (filename.startsWith('.')) {
    throw new BadRequestException('Invalid filename: hidden files not allowed');
  }
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('word') || mimeType.includes('excel')) return 'document';
  return 'other';
}

/**
 * Generate accessible URL for uploaded file
 */
export function generateFileUrl(
  filename: string,
  baseUrl: string = '/uploads',
): string {
  return `${baseUrl}/${filename}`;
}
