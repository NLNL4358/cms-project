import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessorService } from './services/image-processor.service';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaFilterDto, MediaTypeFilter } from './dto/media-filter.dto';
import { generateFileUrl, validateMimeType } from './utils/file.utils';
import * as fs from 'fs';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private imageProcessor: ImageProcessorService,
  ) {}

  /**
   * Create media record after file upload
   */
  async create(
    file: Express.Multer.File,
    userId: string,
    folderId?: string,
    alt?: string,
    caption?: string,
  ) {
    // Validate MIME type
    if (!validateMimeType(file.mimetype)) {
      // Delete uploaded file
      fs.unlinkSync(file.path);
      throw new BadRequestException(
        `지원하지 않는 파일 형식입니다: ${file.mimetype}`,
      );
    }

    // Verify folder exists if provided
    if (folderId) {
      const folder = await this.prisma.mediaFolder.findUnique({
        where: { id: folderId },
      });
      if (!folder) {
        // Delete uploaded file
        fs.unlinkSync(file.path);
        throw new NotFoundException('폴더를 찾을 수 없습니다');
      }
    }

    // Generate URL
    const url = generateFileUrl(file.filename);

    // 이미지 처리 (Sharp 파이프라인)
    let imageData: {
      thumbnails?: object;
      width?: number;
      height?: number;
    } = {};

    if (this.imageProcessor.isProcessableImage(file.mimetype)) {
      try {
        const result = await this.imageProcessor.processImage(
          file.path,
          file.filename,
        );
        imageData = {
          thumbnails: result.thumbnails,
          width: result.width,
          height: result.height,
        };
      } catch (error) {
        // 이미지 처리 실패 시에도 원본 업로드는 유지
        this.logger.warn(
          `이미지 처리 실패 (${file.filename}): ${error.message}`,
        );
      }
    }

    // Create media record
    return this.prisma.media.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url,
        alt: alt || null,
        caption: caption || null,
        ...imageData,
        folderId: folderId || null,
        uploadedById: userId,
      },
      include: {
        folder: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Upload multiple files
   */
  async createMultiple(
    files: Express.Multer.File[],
    userId: string,
    folderId?: string,
  ) {
    const results = await Promise.all(
      files.map((file) => this.create(file, userId, folderId)),
    );
    return results;
  }

  /**
   * Find all media with filters
   */
  async findAll(filters: MediaFilterDto) {
    const {
      folderId,
      mimeType,
      type,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {
      deletedAt: null, // Exclude soft-deleted
    };

    // Filter by folder
    if (folderId) {
      where.folderId = folderId;
    }

    // Filter by MIME type
    if (mimeType) {
      where.mimeType = mimeType;
    }

    // Filter by file category
    if (type) {
      const mimeTypePrefix = this.getMimeTypePrefix(type);
      where.mimeType = {
        startsWith: mimeTypePrefix,
      };
    }

    // Search by filename or original name
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        include: {
          folder: true,
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one media by ID
   */
  async findOne(id: string) {
    const media = await this.prisma.media.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        folder: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('미디어를 찾을 수 없습니다');
    }

    return media;
  }

  /**
   * Update media metadata
   */
  async update(id: string, updateMediaDto: UpdateMediaDto) {
    // Check if media exists
    await this.findOne(id);

    // Verify new folder exists if changing folder
    if (updateMediaDto.folderId) {
      const folder = await this.prisma.mediaFolder.findUnique({
        where: { id: updateMediaDto.folderId },
      });
      if (!folder) {
        throw new NotFoundException('폴더를 찾을 수 없습니다');
      }
    }

    return this.prisma.media.update({
      where: { id },
      data: updateMediaDto,
      include: {
        folder: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete media
   */
  async remove(id: string) {
    // Check if media exists
    await this.findOne(id);

    // Soft delete
    await this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: '미디어가 삭제되었습니다' };
  }

  /**
   * Hard delete media (remove from DB and disk)
   */
  async hardDelete(id: string) {
    const media = await this.findOne(id);

    // Delete file from disk
    if (fs.existsSync(media.path)) {
      fs.unlinkSync(media.path);
    }

    // 썸네일 및 WebP 파일 삭제
    if (this.imageProcessor.isProcessableImage(media.mimeType)) {
      await this.imageProcessor.deleteProcessedFiles(media.filename);
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id },
    });

    return { message: '미디어가 영구적으로 삭제되었습니다' };
  }

  /**
   * Helper: Get MIME type prefix from category
   */
  private getMimeTypePrefix(type: MediaTypeFilter): string {
    const map: Record<MediaTypeFilter, string> = {
      [MediaTypeFilter.IMAGE]: 'image/',
      [MediaTypeFilter.VIDEO]: 'video/',
      [MediaTypeFilter.AUDIO]: 'audio/',
      [MediaTypeFilter.DOCUMENT]: 'application/',
      [MediaTypeFilter.OTHER]: '',
    };
    return map[type] || '';
  }
}
