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

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

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

    // 콘텐츠 생성
    const content = await this.prisma.content.create({
      data: {
        ...rest,
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

    return content;
  }

  async findAll(query?: {
    contentTypeId?: string;
    status?: ContentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      contentTypeId,
      status,
      search,
      page = 1,
      limit = 20,
    } = query || {};

    const where: any = {
      deletedAt: null,
    };

    if (contentTypeId) {
      where.contentTypeId = contentTypeId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
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

    // 콘텐츠 업데이트
    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        ...rest,
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

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    // 소프트 삭제
    await this.prisma.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

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
