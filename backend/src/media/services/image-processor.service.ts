import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

/** 썸네일 사이즈 정의 */
const THUMBNAIL_SIZES = {
  sm: { width: 150, height: 150 },
  md: { width: 300, height: 300 },
  lg: { width: 600, height: 600 },
} as const;

/** Sharp 처리 가능한 MIME 타입 */
const PROCESSABLE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export interface ImageProcessResult {
  width: number;
  height: number;
  thumbnails: {
    sm: string;
    md: string;
    lg: string;
    webp: string;
  };
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('upload.path') || './uploads';
  }

  /**
   * 이미지 파일인지 확인 (Sharp 처리 가능 여부)
   */
  isProcessableImage(mimeType: string): boolean {
    return PROCESSABLE_MIME_TYPES.includes(mimeType);
  }

  /**
   * 이미지 처리 파이프라인 실행
   * 1. 메타데이터 추출 (원본 크기)
   * 2. 썸네일 생성 (sm/md/lg)
   * 3. WebP 변환
   */
  async processImage(
    filePath: string,
    filename: string,
  ): Promise<ImageProcessResult> {
    // 디렉토리 생성
    this.ensureDirectories();

    // 원본 메타데이터 추출
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // 썸네일 생성
    const thumbnailUrls: Record<string, string> = {};

    for (const [size, dimensions] of Object.entries(THUMBNAIL_SIZES)) {
      const thumbFilename = filename;
      const thumbPath = path.join(
        this.uploadPath,
        'thumbnails',
        size,
        thumbFilename,
      );

      await sharp(filePath)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'centre',
        })
        .toFile(thumbPath);

      thumbnailUrls[size] = `/uploads/thumbnails/${size}/${thumbFilename}`;
    }

    // WebP 변환
    const webpFilename = path.parse(filename).name + '.webp';
    const webpPath = path.join(this.uploadPath, 'webp', webpFilename);

    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(webpPath);

    thumbnailUrls.webp = `/uploads/webp/${webpFilename}`;

    this.logger.log(
      `이미지 처리 완료: ${filename} (${width}x${height})`,
    );

    return {
      width,
      height,
      thumbnails: thumbnailUrls as ImageProcessResult['thumbnails'],
    };
  }

  /**
   * 썸네일 및 WebP 파일 삭제
   */
  async deleteProcessedFiles(filename: string): Promise<void> {
    // 썸네일 삭제
    for (const size of Object.keys(THUMBNAIL_SIZES)) {
      const thumbPath = path.join(
        this.uploadPath,
        'thumbnails',
        size,
        filename,
      );
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // WebP 삭제
    const webpFilename = path.parse(filename).name + '.webp';
    const webpPath = path.join(this.uploadPath, 'webp', webpFilename);
    if (fs.existsSync(webpPath)) {
      fs.unlinkSync(webpPath);
    }
  }

  /**
   * 필요한 디렉토리 생성
   */
  private ensureDirectories(): void {
    const dirs = [
      path.join(this.uploadPath, 'thumbnails', 'sm'),
      path.join(this.uploadPath, 'thumbnails', 'md'),
      path.join(this.uploadPath, 'thumbnails', 'lg'),
      path.join(this.uploadPath, 'webp'),
      path.join(this.uploadPath, 'temp'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
}
