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

  /** 콘텐츠 폼 목록 */
  @Get('content-forms')
  listContentForms() {
    return this.service.listContentForms();
  }

  /** 콘텐츠 폼 단건 조회 */
  @Get('content-forms/:slug')
  getContentForm(@Param('slug') slug: string) {
    return this.service.getContentForm(slug);
  }

  /** 발행된 콘텐츠 목록 (필터링/페이지네이션) */
  @Get('contents/:contentFormSlug')
  listContents(
    @Param('contentFormSlug') contentFormSlug: string,
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
      contentFormSlug,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sort: query.sort,
      order: query.order,
      search: query.search,
      filter,
    });
  }

  /** 발행된 콘텐츠 단건 조회 (slug) */
  @Get('contents/:contentFormSlug/:slug')
  getContentBySlug(
    @Param('contentFormSlug') contentFormSlug: string,
    @Param('slug') slug: string,
  ) {
    return this.service.getContentBySlug(contentFormSlug, slug);
  }
}
