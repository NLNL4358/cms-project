import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Meilisearch } from 'meilisearch';

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_API_KEY = process.env.MEILI_API_KEY || '';

const CONTENT_INDEX = 'contents';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: Meilisearch;

  constructor(private prisma: PrismaService) {
    this.client = new Meilisearch({
      host: MEILI_HOST,
      apiKey: MEILI_API_KEY || undefined,
    });
  }

  async onModuleInit() {
    try {
      await this.ensureIndex();
      await this.syncAll();
      this.logger.log('MeiliSearch 인덱스 초기화 완료');
    } catch (error) {
      this.logger.warn(`MeiliSearch 연결 실패 (검색 없이 계속): ${error.message}`);
    }
  }

  /** 인덱스 생성 및 설정 */
  private async ensureIndex() {
    try {
      await this.client.getIndex(CONTENT_INDEX);
    } catch {
      await this.client.createIndex(CONTENT_INDEX, { primaryKey: 'id' });
    }

    // 검색 대상 필드 설정
    await this.client.index(CONTENT_INDEX).updateSearchableAttributes([
      'title', 'slug', 'contentTypeName', 'dataText',
    ]);

    // 필터 가능 필드
    await this.client.index(CONTENT_INDEX).updateFilterableAttributes([
      'contentTypeId', 'contentTypeSlug', 'status',
    ]);

    // 정렬 가능 필드
    await this.client.index(CONTENT_INDEX).updateSortableAttributes([
      'createdAt', 'updatedAt',
    ]);
  }

  /** 전체 콘텐츠를 MeiliSearch에 동기화 */
  async syncAll() {
    const contents = await this.prisma.content.findMany({
      where: { deletedAt: null },
      include: {
        contentType: { select: { name: true, slug: true } },
      },
    });

    const documents = contents.map((c) => this.toDocument(c));

    if (documents.length > 0) {
      await this.client.index(CONTENT_INDEX).addDocuments(documents);
      this.logger.log(`${documents.length}건 인덱싱 완료`);
    }
  }

  /** 단건 인덱싱 (생성/수정 시) */
  async indexContent(contentId: string) {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        include: {
          contentType: { select: { name: true, slug: true } },
        },
      });

      if (!content || content.deletedAt) {
        await this.removeContent(contentId);
        return;
      }

      await this.client
        .index(CONTENT_INDEX)
        .addDocuments([this.toDocument(content)]);
    } catch (error) {
      this.logger.warn(`인덱싱 실패 (${contentId}): ${error.message}`);
    }
  }

  /** 단건 제거 (삭제 시) */
  async removeContent(contentId: string) {
    try {
      await this.client.index(CONTENT_INDEX).deleteDocument(contentId);
    } catch (error) {
      this.logger.warn(`인덱스 제거 실패 (${contentId}): ${error.message}`);
    }
  }

  /** 통합 검색 */
  async search(query: string, options?: {
    contentTypeSlug?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const filter: string[] = [];
    if (options?.contentTypeSlug) {
      filter.push(`contentTypeSlug = "${options.contentTypeSlug}"`);
    }
    if (options?.status) {
      filter.push(`status = "${options.status}"`);
    }

    try {
      const result = await this.client.index(CONTENT_INDEX).search(query, {
        filter: filter.length > 0 ? filter.join(' AND ') : undefined,
        offset: (page - 1) * limit,
        limit,
        attributesToHighlight: ['title', 'dataText'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      });

      return {
        data: result.hits,
        meta: {
          total: result.estimatedTotalHits,
          page,
          limit,
          query,
          processingTimeMs: result.processingTimeMs,
        },
      };
    } catch (error) {
      this.logger.warn(`검색 실패: ${error.message}`);
      // MeiliSearch 장애 시 DB 폴백
      return this.fallbackSearch(query, options);
    }
  }

  /** MeiliSearch 장애 시 DB 직접 검색 (폴백) */
  private async fallbackSearch(query: string, options?: {
    contentTypeSlug?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (options?.contentTypeSlug) {
      where.contentType = { slug: options.contentTypeSlug };
    }
    if (options?.status) {
      where.status = options.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: { contentType: { select: { name: true, slug: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data: data.map((c) => this.toDocument(c)),
      meta: { total, page, limit, query, processingTimeMs: 0, fallback: true },
    };
  }

  /** Prisma 레코드 → MeiliSearch 문서 변환 */
  private toDocument(content: any) {
    // data JSON에서 텍스트 추출 (검색용)
    const dataText = this.extractText(content.data);

    return {
      id: content.id,
      title: content.title,
      slug: content.slug,
      status: content.status,
      contentTypeId: content.contentTypeId,
      contentTypeName: content.contentType?.name || '',
      contentTypeSlug: content.contentType?.slug || '',
      dataText,
      createdAt: new Date(content.createdAt).getTime(),
      updatedAt: new Date(content.updatedAt).getTime(),
    };
  }

  /** JSON 객체에서 문자열 값만 추출 */
  private extractText(data: any): string {
    if (!data || typeof data !== 'object') return '';
    const texts: string[] = [];
    for (const val of Object.values(data)) {
      if (typeof val === 'string') {
        // HTML 태그 제거
        texts.push(val.replace(/<[^>]*>/g, ''));
      } else if (typeof val === 'object' && val !== null) {
        texts.push(this.extractText(val));
      }
    }
    return texts.join(' ');
  }
}
