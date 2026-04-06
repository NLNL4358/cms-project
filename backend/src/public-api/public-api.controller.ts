import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from '../api-key/api-key.guard';

/**
 * Public API
 * 외부 프론트엔드에서 발행된 콘텐츠를 읽기 위한 공개 API
 * Authorization: Bearer sk_live_xxxxxx (API 키) 필수
 */
@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly service: PublicApiService) {}

  /** 콘텐츠 타입 목록 */
  @Get('content-types')
  listContentTypes() {
    return this.service.listContentTypes();
  }

  /** 콘텐츠 타입 단건 조회 */
  @Get('content-types/:slug')
  getContentType(@Param('slug') slug: string) {
    return this.service.getContentType(slug);
  }

  /** 발행된 콘텐츠 목록 (필터링/페이지네이션) */
  @Get('contents/:contentTypeSlug')
  listContents(
    @Param('contentTypeSlug') contentTypeSlug: string,
    @Query() query: any,
  ) {
    // filter[fieldName]=value 파싱
    const filter: Record<string, any> = {};
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const fieldName = key.slice(7, -1);
        filter[fieldName] = value;
      }
    }

    return this.service.listContents({
      contentTypeSlug,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sort: query.sort,
      order: query.order,
      search: query.search,
      filter,
    });
  }

  /** 발행된 콘텐츠 단건 조회 (slug) */
  @Get('contents/:contentTypeSlug/:slug')
  getContentBySlug(
    @Param('contentTypeSlug') contentTypeSlug: string,
    @Param('slug') slug: string,
  ) {
    return this.service.getContentBySlug(contentTypeSlug, slug);
  }
}
