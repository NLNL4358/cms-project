import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContentStatus } from '@prisma/client';

@ApiTags('Contents')
@Controller('contents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '콘텐츠 생성',
    description: '새로운 콘텐츠를 생성합니다',
  })
  @ApiResponse({ status: 201, description: '콘텐츠 생성 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 타입을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 slug' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  create(
    @Body() createContentDto: CreateContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.create(createContentDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: '콘텐츠 목록 조회',
    description: '모든 콘텐츠를 조회합니다 (필터링, 페이지네이션 지원)',
  })
  @ApiQuery({
    name: 'contentTypeId',
    required: false,
    description: '콘텐츠 타입 ID로 필터링',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ContentStatus,
    description: '상태로 필터링',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '제목/slug로 검색',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findAll(
    @Query('contentTypeId') contentTypeId?: string,
    @Query('status') status?: ContentStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.findAll({
      contentTypeId,
      status,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: '콘텐츠 단일 조회',
    description: 'ID로 특정 콘텐츠를 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Get(':contentTypeId/slug/:slug')
  @ApiOperation({
    summary: 'slug로 콘텐츠 조회',
    description: 'ContentType ID와 slug로 콘텐츠를 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findBySlug(
    @Param('contentTypeId') contentTypeId: string,
    @Param('slug') slug: string,
  ) {
    return this.contentService.findBySlug(contentTypeId, slug);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '콘텐츠 수정',
    description: '기존 콘텐츠를 수정합니다 (버전 히스토리 자동 저장)',
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 slug' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.update(id, updateContentDto, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '콘텐츠 삭제',
    description: '콘텐츠를 삭제합니다 (소프트 삭제)',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '콘텐츠 발행',
    description: '콘텐츠를 발행 상태로 변경합니다',
  })
  @ApiResponse({ status: 200, description: '발행 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '이미 발행된 콘텐츠' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  publish(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.contentService.publish(id, userId);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '콘텐츠 미발행',
    description: '발행된 콘텐츠를 미발행 상태로 변경합니다',
  })
  @ApiResponse({ status: 200, description: '미발행 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({
    status: 400,
    description: '발행된 콘텐츠만 미발행할 수 있음',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  unpublish(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.contentService.unpublish(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({
    summary: '콘텐츠 버전 히스토리 조회',
    description: '콘텐츠의 모든 버전 히스토리를 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getVersions(@Param('id') id: string) {
    return this.contentService.getVersions(id);
  }

  @Post(':id/versions/:version/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 버전으로 복원',
    description: '콘텐츠를 특정 버전으로 복원합니다',
  })
  @ApiResponse({ status: 200, description: '복원 성공' })
  @ApiResponse({
    status: 404,
    description: '콘텐츠 또는 버전을 찾을 수 없음',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  restoreVersion(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.restoreVersion(id, parseInt(version), userId);
  }
}
