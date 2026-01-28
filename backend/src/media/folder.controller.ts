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
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@ApiTags('Media Folders')
@Controller('media/folders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @Permissions('media:create', 'media:*', '*')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '폴더 생성',
    description: '새로운 미디어 폴더를 생성합니다',
  })
  @ApiResponse({ status: 201, description: '폴더 생성 성공' })
  @ApiResponse({ status: 404, description: '상위 폴더를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(@Body() createFolderDto: CreateFolderDto) {
    return this.folderService.create(createFolderDto);
  }

  @Get()
  @Permissions('media:read', 'media:*', '*')
  @ApiOperation({
    summary: '폴더 목록 조회',
    description: '모든 미디어 폴더를 계층 구조와 함께 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findAll() {
    return this.folderService.findAll();
  }

  @Get(':id')
  @Permissions('media:read', 'media:*', '*')
  @ApiOperation({
    summary: '폴더 단일 조회',
    description: 'ID로 특정 폴더를 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '폴더를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findOne(@Param('id') id: string) {
    return this.folderService.findOne(id);
  }

  @Patch(':id')
  @Permissions('media:update', 'media:*', '*')
  @ApiOperation({
    summary: '폴더 수정',
    description: '폴더 이름 또는 상위 폴더를 수정합니다',
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '폴더를 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '순환 참조 발생' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    return this.folderService.update(id, updateFolderDto);
  }

  @Delete(':id')
  @Permissions('media:delete', 'media:*', '*')
  @ApiOperation({
    summary: '폴더 삭제',
    description: '폴더를 삭제합니다 (하위 폴더나 파일이 없어야 함)',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '폴더를 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '하위 폴더 또는 파일이 존재함',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  remove(@Param('id') id: string) {
    return this.folderService.remove(id);
  }
}
