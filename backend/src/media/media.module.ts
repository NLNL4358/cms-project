import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { ImageProcessorService } from './services/image-processor.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';
import { diskStorage } from 'multer';
import { getStorageConfig } from './utils/storage.config';

@Module({
  imports: [
    PrismaModule,
    RoleModule,
    // Multer 파일 업로드 설정
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // 디스크 저장 방식 사용
        storage: diskStorage(getStorageConfig(configService)),
        // 파일 크기 제한 (50MB)
        limits: {
          fileSize: configService.get('upload.maxFileSize'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FolderController, MediaController],
  providers: [MediaService, FolderService, ImageProcessorService],
  exports: [MediaService, FolderService, ImageProcessorService],
})
export class MediaModule {}
