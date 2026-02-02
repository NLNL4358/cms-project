import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * 예약 발행 체크 (1분 간격)
   * scheduledAt이 현재 시간을 지났으면 자동으로 PUBLISHED 상태로 변경
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublishing() {
    const now = new Date();

    const contents = await this.prisma.content.updateMany({
      where: {
        status: 'DRAFT',
        scheduledAt: {
          lte: now,
        },
        deletedAt: null,
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
      },
    });

    if (contents.count > 0) {
      this.logger.log(`예약 발행 처리: ${contents.count}건`);
    }
  }

  /**
   * 휴지통 자동 비우기 (매일 새벽 3시)
   * 30일 이상 소프트 삭제된 항목을 영구 삭제
   */
  @Cron('0 3 * * *')
  async handleTrashCleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 미디어 파일 영구 삭제 (디스크 파일도 함께 삭제)
    const expiredMedia = await this.prisma.media.findMany({
      where: {
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    for (const media of expiredMedia) {
      // 원본 파일 삭제
      if (fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }

      // 썸네일 파일 삭제
      const uploadPath =
        this.configService.get('upload.path') || './uploads';
      const thumbnailSizes = ['sm', 'md', 'lg'];
      for (const size of thumbnailSizes) {
        const thumbPath = path.join(
          uploadPath,
          'thumbnails',
          size,
          media.filename,
        );
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }

      // WebP 파일 삭제
      const webpFilename =
        path.parse(media.filename).name + '.webp';
      const webpPath = path.join(uploadPath, 'webp', webpFilename);
      if (fs.existsSync(webpPath)) {
        fs.unlinkSync(webpPath);
      }
    }

    const deletedMedia = await this.prisma.media.deleteMany({
      where: {
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    // 콘텐츠 영구 삭제
    const deletedContents = await this.prisma.content.deleteMany({
      where: {
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    const totalDeleted = deletedMedia.count + deletedContents.count;
    if (totalDeleted > 0) {
      this.logger.log(
        `휴지통 정리: 미디어 ${deletedMedia.count}건, 콘텐츠 ${deletedContents.count}건 영구 삭제`,
      );
    }
  }

  /**
   * 임시 파일 정리 (매일 새벽 4시)
   * 24시간 이상된 temp 폴더 파일 삭제
   */
  @Cron('0 4 * * *')
  async handleTempFileCleanup() {
    const uploadPath =
      this.configService.get('upload.path') || './uploads';
    const tempDir = path.join(uploadPath, 'temp');

    if (!fs.existsSync(tempDir)) {
      return;
    }

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stat = fs.statSync(filePath);

      if (stat.mtimeMs < oneDayAgo) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`임시 파일 정리: ${cleanedCount}건 삭제`);
    }
  }
}
