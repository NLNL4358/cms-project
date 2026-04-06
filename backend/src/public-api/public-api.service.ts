import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class PublicApiService {
  constructor(private prisma: PrismaService) {}

  /**
   * 콘텐츠 타입 목록 (공개)
   */
  async listContentTypes() {
    return this.prisma.contentType.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        fields: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 콘텐츠 타입 단건 조회 (slug)
   */
  async getContentType(slug: string) {
    const ct = await this.prisma.contentType.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        fields: true,
      },
    });
    if (!ct) throw new NotFoundException('콘텐츠 타입을 찾을 수 없습니다');
    return ct;
  }

  /**
   * 발행된 콘텐츠 목록 (공개) — 커스텀 필드 필터링 지원
   *
   * 쿼리 파라미터:
   * - contentTypeSlug: 콘텐츠 타입 슬러그 (필수)
   * - page, limit: 페이지네이션
   * - sort: createdAt | updatedAt | publishedAt (기본: publishedAt)
   * - order: asc | desc (기본: desc)
   * - filter[필드명]: 동적 필드 필터링 (예: filter[category]=tech)
   */
  async listContents(query: {
    contentTypeSlug: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, any>;
    search?: string;
  }) {
    if (!query.contentTypeSlug) {
      throw new BadRequestException('contentTypeSlug가 필요합니다');
    }

    const contentType = await this.prisma.contentType.findUnique({
      where: { slug: query.contentTypeSlug },
    });
    if (!contentType) {
      throw new NotFoundException('콘텐츠 타입을 찾을 수 없습니다');
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // 최대 100
    const skip = (page - 1) * limit;

    const where: any = {
      contentTypeId: contentType.id,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    };

    // 검색
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 동적 필드 필터링: filter[fieldName]=value → data->>'fieldName' = value
    if (query.filter && typeof query.filter === 'object') {
      const conditions: any[] = [];
      for (const [key, value] of Object.entries(query.filter)) {
        if (value === '' || value === undefined || value === null) continue;
        conditions.push({
          data: {
            path: [key],
            equals: this.coerceValue(value as string),
          },
        });
      }
      if (conditions.length > 0) {
        where.AND = conditions;
      }
    }

    // 정렬
    const sortField = ['createdAt', 'updatedAt', 'publishedAt'].includes(query.sort || '')
      ? query.sort
      : 'publishedAt';
    const orderBy: any = { [sortField as string]: query.order === 'asc' ? 'asc' : 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          data: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 발행된 콘텐츠 단건 조회 (slug)
   */
  async getContentBySlug(contentTypeSlug: string, slug: string) {
    const contentType = await this.prisma.contentType.findUnique({
      where: { slug: contentTypeSlug },
    });
    if (!contentType) {
      throw new NotFoundException('콘텐츠 타입을 찾을 수 없습니다');
    }

    const content = await this.prisma.content.findFirst({
      where: {
        contentTypeId: contentType.id,
        slug,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        data: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다');
    }

    return content;
  }

  /** 문자열을 숫자/불리언으로 자동 변환 (필터링용) */
  private coerceValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    return value;
  }
}
