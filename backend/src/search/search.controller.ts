import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** 통합 검색 */
  @Get()
  search(
    @Query('q') q: string,
    @Query('contentFormSlug') contentFormSlug?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search(q || '', {
      contentFormSlug,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /** 인덱스 전체 재동기화 (관리자용) */
  @Post('reindex')
  reindex() {
    return this.searchService.syncAll().then(() => ({
      success: true,
      message: '재인덱싱이 완료되었습니다',
    }));
  }
}
