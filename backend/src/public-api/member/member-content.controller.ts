/**
 * @description
 * 일반 회원(MEMBER)이 콘텐츠를 작성/수정/삭제하는 API
 * 콘텐츠 폼의 options.memberWritable이 true인 경우만 허용
 * 본인이 작성한 콘텐츠만 수정/삭제 가능
 */
import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ContentStatus } from '@prisma/client';
import { sanitizeContentData } from '../../common/utils/sanitize.util';
import { SearchService } from '../../search/search.service';
import { WebhookService } from '../../webhook/webhook.service';

@Controller('public/member/contents')
@UseGuards(JwtAuthGuard)
export class MemberContentController {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
    private webhookService: WebhookService,
  ) {}

  /** 내가 작성한 콘텐츠 목록 */
  @Get('my')
  async listMine(
    @CurrentUser('id') userId: string,
    @Query('contentFormSlug') contentFormSlug?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const where: any = {
      createdById: userId,
      deletedAt: null,
    };

    if (contentFormSlug) {
      const ct = await this.prisma.contentForm.findUnique({
        where: { slug: contentFormSlug },
      });
      if (ct) where.contentFormId = ct.id;
    }

    const [data, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          data: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /** 콘텐츠 작성 (콘텐츠 폼의 memberWritable이 true여야 함) */
  @Post(':contentFormSlug')
  async create(
    @Param('contentFormSlug') contentFormSlug: string,
    @Body() body: { title: string; slug: string; data?: any },
    @CurrentUser('id') userId: string,
  ) {
    const contentForm = await this.prisma.contentForm.findUnique({
      where: { slug: contentFormSlug },
    });
    if (!contentForm) {
      throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    }

    // 멤버 쓰기 권한 확인
    const options = (contentForm.options || {}) as any;
    if (!options.memberWritable) {
      throw new ForbiddenException('이 콘텐츠 폼은 회원이 작성할 수 없습니다');
    }

    if (!body.title?.trim() || !body.slug?.trim()) {
      throw new BadRequestException('제목과 고유주소는 필수입니다');
    }

    // 콘텐츠 폼 정의 기반 필수 필드 검증
    const fields = Array.isArray(contentForm.fields) ? contentForm.fields : [];
    const requiredFields = (fields as any[]).filter((f) => f.required);
    for (const field of requiredFields) {
      const value = body.data?.[field.name];
      if (value === undefined || value === null || value === '') {
        throw new BadRequestException(`"${field.label || field.name}" 필드는 필수입니다`);
      }
    }

    // slug 중복 체크
    const existing = await this.prisma.content.findFirst({
      where: { contentFormId: contentForm.id, slug: body.slug, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 고유주소입니다');
    }

    // 데이터 sanitize
    const sanitizedData = body.data
      ? sanitizeContentData(body.data, contentForm.fields as any[])
      : {};

    // 자동 발행 여부 (옵션)
    const autoPublish = options.memberAutoPublish === true;

    const content = await this.prisma.content.create({
      data: {
        contentFormId: contentForm.id,
        title: body.title,
        slug: body.slug,
        data: sanitizedData,
        status: autoPublish ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
        publishedAt: autoPublish ? new Date() : null,
        createdById: userId,
        updatedById: userId,
      },
    });

    // 검색 인덱스 업데이트
    this.searchService.indexContent(content.id).catch(() => {});

    // Webhook 발사
    this.webhookService.dispatch('member:content:create', { id: content.id, title: content.title, userId }).catch(() => {});
    if (autoPublish) {
      this.webhookService.dispatch('content:publish', { id: content.id, title: content.title, by: 'member' }).catch(() => {});
    }

    return content;
  }

  /** 본인 콘텐츠 수정 */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; data?: any },
    @CurrentUser('id') userId: string,
  ) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: { contentForm: true },
    });
    if (!content || content.deletedAt) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다');
    }
    if (content.createdById !== userId) {
      throw new ForbiddenException('본인이 작성한 콘텐츠만 수정할 수 있습니다');
    }

    const data: any = { updatedById: userId };
    if (body.title !== undefined) data.title = body.title;
    if (body.data !== undefined) {
      data.data = sanitizeContentData(body.data, content.contentForm.fields as any[]);
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data,
    });

    this.searchService.indexContent(updated.id).catch(() => {});
    return updated;
  }

  /** 본인 콘텐츠 삭제 (소프트 삭제) */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content || content.deletedAt) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다');
    }
    if (content.createdById !== userId) {
      throw new ForbiddenException('본인이 작성한 콘텐츠만 삭제할 수 있습니다');
    }

    await this.prisma.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.searchService.removeContent(id).catch(() => {});
    return { success: true, message: '콘텐츠가 삭제되었습니다' };
  }
}
