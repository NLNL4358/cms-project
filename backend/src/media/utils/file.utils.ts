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
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Videos
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  // Audio
  'audio/mpeg',
  'audio/wav',
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
