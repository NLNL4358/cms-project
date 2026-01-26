import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { generateUniqueFilename } from './file.utils';

export const getStorageConfig = (configService: ConfigService) => ({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void,
  ) => {
    const uploadPath = configService.get('upload.path') || './uploads';

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    callback(null, uploadPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    callback(null, uniqueFilename);
  },
});
