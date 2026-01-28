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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContentTypeService } from './content-type.service';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@ApiTags('Content Types')
@Controller('content-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class ContentTypeController {
  constructor(private readonly contentTypeService: ContentTypeService) {}

  @Post()
  @Permissions('content-type:create', 'content-type:*', '*')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '콘텐츠 타입 생성',
    description: '새로운 콘텐츠 타입을 생성합니다',
  })
  @ApiResponse({ status: 201, description: '콘텐츠 타입 생성 성공' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 slug' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(@Body() createContentTypeDto: CreateContentTypeDto) {
    return this.contentTypeService.create(createContentTypeDto);
  }

  @Get()
  @Permissions('content-type:read', 'content-type:*', '*')
  @ApiOperation({
    summary: '콘텐츠 타입 목록 조회',
    description: '모든 콘텐츠 타입을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findAll() {
    return this.contentTypeService.findAll();
  }

  @Get(':id')
  @Permissions('content-type:read', 'content-type:*', '*')
  @ApiOperation({
    summary: '콘텐츠 타입 단일 조회',
    description: 'ID 또는 slug로 특정 콘텐츠 타입을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 타입을 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findOne(@Param('id') idOrSlug: string) {
    return this.contentTypeService.findOne(idOrSlug);
  }

  @Patch(':id')
  @Permissions('content-type:update', 'content-type:*', '*')
  @ApiOperation({
    summary: '콘텐츠 타입 수정',
    description: 'ID 또는 slug로 콘텐츠 타입을 수정합니다',
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 타입을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 slug' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  update(
    @Param('id') idOrSlug: string,
    @Body() updateContentTypeDto: UpdateContentTypeDto,
  ) {
    return this.contentTypeService.update(idOrSlug, updateContentTypeDto);
  }

  @Delete(':id')
  @Permissions('content-type:delete', 'content-type:*', '*')
  @ApiOperation({
    summary: '콘텐츠 타입 삭제',
    description: 'ID 또는 slug로 콘텐츠 타입을 삭제합니다 (콘텐츠가 없는 경우에만 가능)',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 타입을 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '이 콘텐츠 타입을 사용하는 콘텐츠가 존재함',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  remove(@Param('id') idOrSlug: string) {
    return this.contentTypeService.remove(idOrSlug);
  }
}
