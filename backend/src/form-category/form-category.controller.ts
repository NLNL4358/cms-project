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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { FormCategoryService } from './form-category.service';
import { CreateFormCategoryDto } from './dto/create-form-category.dto';
import { UpdateFormCategoryDto } from './dto/update-form-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@ApiTags('FormCategory')
@Controller('form-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class FormCategoryController {
  constructor(private readonly service: FormCategoryService) {}

  @Get()
  @Permissions('content-form:read', 'content-form:*', 'content:read', 'content:*', '*')
  @ApiOperation({ summary: '카테고리 목록 조회', description: '콘텐츠 폼을 분류하는 카테고리 목록을 반환합니다' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('content-form:read', 'content-form:*', '*')
  @ApiOperation({ summary: '카테고리 상세', description: '카테고리와 소속 콘텐츠 폼 목록을 반환합니다' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('content-form:create', 'content-form:*', '*')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '카테고리 생성' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 이름/고유주소' })
  create(@Body() dto: CreateFormCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('content-form:update', 'content-form:*', '*')
  @ApiOperation({ summary: '카테고리 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateFormCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('content-form:delete', 'content-form:*', '*')
  @ApiOperation({ summary: '카테고리 삭제', description: '소속 콘텐츠 폼들은 categoryId가 NULL로 변경됩니다' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
