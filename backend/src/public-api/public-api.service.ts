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
   * 콘텐츠 폼 목록 (공개)
   */
  async listContentForms() {
    return this.prisma.contentForm.findMany({
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
   * 콘텐츠 폼 단건 조회 (slug)
   */
  async getContentForm(slug: string) {
    const ct = await this.prisma.contentForm.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        fields: true,
      },
    });
    if (!ct) throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    return ct;
  }

  /**
   * 발행된 콘텐츠 목록 (공개) — 커스텀 필드 필터링 지원
   *
   * 쿼리 파라미터:
   * - contentFormSlug: 콘텐츠 폼 슬러그 (필수)
   * - page, limit: 페이지네이션
   * - sort: createdAt | updatedAt | publishedAt (기본: publishedAt)
   * - order: asc | desc (기본: desc)
   * - filter[필드명]: 동적 필드 필터링 (예: filter[category]=tech)
   */
  async listContents(query: {
    contentFormSlug: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, any>;
    search?: string;
  }) {
    if (!query.contentFormSlug) {
      throw new BadRequestException('contentFormSlug가 필요합니다');
    }

    const contentForm = await this.prisma.contentForm.findUnique({
      where: { slug: query.contentFormSlug },
    });
    if (!contentForm) {
      throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    }

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 10, 1), 100); // 1~100
    const skip = (page - 1) * limit;

    const where: any = {
      contentFormId: contentForm.id,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      isPrivate: false, // 비밀글은 Public API에서 제외
    };

    // 검색 + 필터 조건을 모두 AND로 묶기 (OR/AND 충돌 방지)
    const andConditions: any[] = [];

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    // 동적 필드 필터링: filter[fieldName]=value → data->>'fieldName' = value
    if (query.filter && typeof query.filter === 'object') {
      // 콘텐츠 폼의 정의된 필드만 허용 (필드 인젝션 방지)
      const allowedFields = Array.isArray(contentForm.fields)
        ? (contentForm.fields as any[]).map((f) => f.name)
        : [];

      for (const [key, value] of Object.entries(query.filter)) {
        if (value === '' || value === undefined || value === null) continue;
        if (!allowedFields.includes(key)) continue; // 정의되지 않은 필드는 무시
        andConditions.push({
          data: {
            path: [key],
            equals: this.coerceValue(value as string),
          },
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
  async getContentBySlug(contentFormSlug: string, slug: string) {
    const contentForm = await this.prisma.contentForm.findUnique({
      where: { slug: contentFormSlug },
    });
    if (!contentForm) {
      throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    }

    const content = await this.prisma.content.findFirst({
      where: {
        contentFormId: contentForm.id,
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
