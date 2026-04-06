import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentStatus } from '@prisma/client';
import { sanitizeContentData } from '../common/utils/sanitize.util';
import { SearchService } from '../search/search.service';
import { WebhookService } from '../webhook/webhook.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
    private webhookService: WebhookService,
  ) {}

  async create(createContentDto: CreateContentDto, userId: string) {
    const { contentTypeId, slug, status, scheduledAt, ...rest } =
      createContentDto;

    // ContentType 존재 확인
    const contentType = await this.prisma.contentType.findUnique({
      where: { id: contentTypeId },
    });
    if (!contentType) {
      throw new NotFoundException('콘텐츠 타입을 찾을 수 없습니다');
    }

    // slug 중복 확인 (같은 contentType 내에서)
    const existing = await this.prisma.content.findFirst({
      where: {
        contentTypeId,
        slug,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 slug입니다');
    }

    // 예약 발행 검증
    if (scheduledAt && status !== ContentStatus.DRAFT) {
      throw new BadRequestException(
        '예약 발행은 상태가 DRAFT일 때만 가능합니다',
      );
    }

    // richtext 필드 XSS sanitize 처리
    const sanitizedRest = { ...rest };
    if (sanitizedRest.data && contentType.fields) {
      sanitizedRest.data = sanitizeContentData(
        sanitizedRest.data as Record<string, any>,
        contentType.fields as any[],
      );
    }

    // 콘텐츠 생성
    const content = await this.prisma.content.create({
      data: {
        ...sanitizedRest,
        contentTypeId,
        slug,
        status: status || ContentStatus.DRAFT,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 초기 버전 히스토리 생성
    await this.prisma.contentVersion.create({
      data: {
        contentId: content.id,
        data: content.data as any,
        version: 1,
      },
    });

    // 검색 인덱스 업데이트
    this.searchService.indexContent(content.id).catch(() => {});

    // Webhook 발사
    this.webhookService.dispatch('content:create', { id: content.id, title: content.title, slug: content.slug }).catch(() => {});

    return content;
  }

  async findAll(query?: {
    contentTypeId?: string;
    status?: ContentStatus;
    search?: string;
    page?: number;
    limit?: number;
    filter?: Record<string, any>;
  }) {
    const {
      contentTypeId,
      status,
      search,
      page: rawPage = 1,
      limit: rawLimit = 20,
      filter,
    } = query || {};

    const page = Math.max(rawPage || 1, 1);
    const limit = Math.min(Math.max(rawLimit || 20, 1), 100);

    const where: any = {
      deletedAt: null,
    };

    if (contentTypeId) {
      where.contentTypeId = contentTypeId;
    }

    if (status) {
      where.status = status;
    }

    // 검색 + 필터 조건을 모두 AND로 묶기 (OR/AND 충돌 방지)
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (filter && typeof filter === 'object') {
      for (const [key, value] of Object.entries(filter)) {
        if (value === '' || value === undefined) continue;
        andConditions.push({
          data: {
            path: [key],
            equals: this.coerceFilterValue(value as string),
          },
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          contentType: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data: contents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 필터값을 적절한 타입으로 변환 (true/false/숫자/문자열) */
  private coerceFilterValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    return value;
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findFirst({
      where: { id, deletedAt: null },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다');
    }

    return content;
  }

  async findBySlug(contentTypeId: string, slug: string) {
    const content = await this.prisma.content.findFirst({
      where: {
        contentTypeId,
        slug,
        deletedAt: null,
      },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다');
    }

    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto, userId: string) {
    const existing = await this.findOne(id);

    const { slug, contentTypeId, scheduledAt, ...rest } = updateContentDto;

    // slug 변경 시 중복 확인
    if (slug && slug !== existing.slug) {
      const duplicate = await this.prisma.content.findFirst({
        where: {
          contentTypeId: existing.contentTypeId,
          slug,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictException('이미 사용 중인 slug입니다');
      }
    }

    // contentTypeId 변경은 불가
    if (contentTypeId && contentTypeId !== existing.contentTypeId) {
      throw new BadRequestException('콘텐츠 타입은 변경할 수 없습니다');
    }

    // richtext 필드 XSS sanitize 처리
    const sanitizedRest = { ...rest };
    if (sanitizedRest.data) {
      const contentType = await this.prisma.contentType.findUnique({
        where: { id: existing.contentTypeId },
      });
      if (contentType?.fields) {
        sanitizedRest.data = sanitizeContentData(
          sanitizedRest.data as Record<string, any>,
          contentType.fields as any[],
        );
      }
    }

    // 콘텐츠 업데이트
    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        ...sanitizedRest,
        slug: slug || existing.slug,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : existing.scheduledAt,
        updatedById: userId,
        version: { increment: 1 },
      },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 버전 히스토리 저장
    if (updateContentDto.data) {
      await this.prisma.contentVersion.create({
        data: {
          contentId: id,
          data: updated.data as any,
          version: updated.version,
        },
      });
    }

    // 검색 인덱스 업데이트
    this.searchService.indexContent(updated.id).catch(() => {});

    // Webhook 발사
    this.webhookService.dispatch('content:update', { id: updated.id, title: updated.title }).catch(() => {});

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    // 소프트 삭제
    await this.prisma.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 검색 인덱스에서 제거
    this.searchService.removeContent(id).catch(() => {});

    // Webhook 발사
    this.webhookService.dispatch('content:delete', { id }).catch(() => {});

    return { message: '콘텐츠가 삭제되었습니다' };
  }

  async publish(id: string, userId: string) {
    const content = await this.findOne(id);

    if (content.status === ContentStatus.PUBLISHED) {
      throw new BadRequestException('이미 발행된 콘텐츠입니다');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedById: userId,
      },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Webhook 발사
    this.webhookService.dispatch('content:publish', { id: updated.id, title: updated.title }).catch(() => {});

    return updated;
  }

  async unpublish(id: string, userId: string) {
    const content = await this.findOne(id);

    if (content.status !== ContentStatus.PUBLISHED) {
      throw new BadRequestException('발행된 콘텐츠만 미발행할 수 있습니다');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.DRAFT,
        publishedAt: null,
        updatedById: userId,
      },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Webhook 발사
    this.webhookService.dispatch('content:unpublish', { id: updated.id }).catch(() => {});

    return updated;
  }

  async archive(id: string, userId: string) {
    const content = await this.findOne(id);

    if (content.status === ContentStatus.ARCHIVED) {
      throw new BadRequestException('이미 보관된 콘텐츠입니다');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.ARCHIVED,
        publishedAt: null,
        updatedById: userId,
      },
      include: {
        contentType: true,
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    this.searchService.indexContent(updated.id).catch(() => {});
    return updated;
  }

  async unarchive(id: string, userId: string) {
    const content = await this.findOne(id);

    if (content.status !== ContentStatus.ARCHIVED) {
      throw new BadRequestException('보관된 콘텐츠만 복원할 수 있습니다');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.DRAFT,
        updatedById: userId,
      },
      include: {
        contentType: true,
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    this.searchService.indexContent(updated.id).catch(() => {});
    return updated;
  }

  async getVersions(id: string) {
    await this.findOne(id);

    const versions = await this.prisma.contentVersion.findMany({
      where: { contentId: id },
      orderBy: { version: 'desc' },
    });

    return versions;
  }

  async restoreVersion(id: string, version: number, userId: string) {
    await this.findOne(id);

    const versionData = await this.prisma.contentVersion.findFirst({
      where: {
        contentId: id,
        version,
      },
    });

    if (!versionData) {
      throw new NotFoundException('해당 버전을 찾을 수 없습니다');
    }

    // 버전 데이터로 복원
    const restored = await this.prisma.content.update({
      where: { id },
      data: {
        data: versionData.data as any,
        updatedById: userId,
        version: { increment: 1 },
      },
      include: {
        contentType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 복원도 새 버전으로 기록
    await this.prisma.contentVersion.create({
      data: {
        contentId: id,
        data: restored.data as any,
        version: restored.version,
      },
    });

    return restored;
  }
}
