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
import { ContentFormService } from './content-form.service';
import { CreateContentFormDto } from './dto/create-content-form.dto';
import { UpdateContentFormDto } from './dto/update-content-form.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@ApiTags('Content Forms')
@Controller('content-forms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class ContentFormController {
  constructor(private readonly contentFormService: ContentFormService) {}

  @Post()
  @Permissions('content-form:create', 'content-form:*', '*')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '콘텐츠 폼 생성',
    description: '새로운 콘텐츠 폼을 생성합니다',
  })
  @ApiResponse({ status: 201, description: '콘텐츠 폼 생성 성공' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 고유주소' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(@Body() createContentFormDto: CreateContentFormDto) {
    return this.contentFormService.create(createContentFormDto);
  }

  @Get()
  @Permissions('content-form:read', 'content-form:*', 'content:read', 'content:*', '*')
  @ApiOperation({
    summary: '콘텐츠 폼 목록 조회',
    description:
      '모든 콘텐츠 폼을 조회합니다. ?categoryId=xxx로 카테고리 필터, ?categoryId=null로 카테고리 없는 폼만 조회 가능.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: '카테고리 ID (없음 필터는 "null" 문자열 전달)',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.contentFormService.findAll(categoryId);
  }

  @Get(':id')
  @Permissions('content-form:read', 'content-form:*', 'content:read', 'content:*', '*')
  @ApiOperation({
    summary: '콘텐츠 폼 단일 조회',
    description: 'ID 또는 slug로 특정 콘텐츠 폼을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 폼을 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findOne(@Param('id') idOrSlug: string) {
    return this.contentFormService.findOne(idOrSlug);
  }

  @Patch(':id')
  @Permissions('content-form:update', 'content-form:*', '*')
  @ApiOperation({
    summary: '콘텐츠 폼 수정',
    description: 'ID 또는 slug로 콘텐츠 폼을 수정합니다',
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 폼을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 고유주소' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  update(
    @Param('id') idOrSlug: string,
    @Body() updateContentFormDto: UpdateContentFormDto,
  ) {
    return this.contentFormService.update(idOrSlug, updateContentFormDto);
  }

  @Delete(':id')
  @Permissions('content-form:delete', 'content-form:*', '*')
  @ApiOperation({
    summary: '콘텐츠 폼 삭제',
    description: 'ID 또는 slug로 콘텐츠 폼을 삭제합니다 (콘텐츠가 없는 경우에만 가능)',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 폼을 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '이 콘텐츠 폼을 사용하는 콘텐츠가 존재함',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  remove(@Param('id') idOrSlug: string) {
    return this.contentFormService.remove(idOrSlug);
  }
}
