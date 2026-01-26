import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaFilterDto } from './dto/media-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '단일 파일 업로드',
    description: '파일을 업로드하고 미디어 레코드를 생성합니다',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 파일',
        },
        folderId: {
          type: 'string',
          description: '폴더 ID',
        },
        alt: {
          type: 'string',
          description: '대체 텍스트',
        },
        caption: {
          type: 'string',
          description: '캡션',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '파일 업로드 성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 파일 형식 또는 크기 초과',
  })
  @ApiResponse({ status: 404, description: '폴더를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadMediaDto: UploadMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다');
    }

    return this.mediaService.create(
      file,
      userId,
      uploadMediaDto.folderId,
      uploadMediaDto.alt,
      uploadMediaDto.caption,
    );
  }

  @Post('upload/multiple')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '다중 파일 업로드',
    description: '여러 파일을 한번에 업로드합니다 (최대 10개)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '업로드할 파일들',
        },
        folderId: {
          type: 'string',
          description: '폴더 ID',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '파일 업로드 성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 파일 형식 또는 크기 초과',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseInterceptors(FilesInterceptor('files', 10)) // 최대 10개 파일
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folderId') folderId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 제공되지 않았습니다');
    }

    return this.mediaService.createMultiple(files, userId, folderId);
  }

  @Get()
  @ApiOperation({
    summary: '미디어 목록 조회',
    description: '미디어 파일 목록을 조회합니다 (필터링, 페이지네이션 지원)',
  })
  @ApiQuery({
    name: 'folderId',
    required: false,
    description: '폴더 ID로 필터링',
  })
  @ApiQuery({
    name: 'mimeType',
    required: false,
    description: 'MIME 타입으로 필터링',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['image', 'video', 'audio', 'document', 'other'],
    description: '파일 타입으로 필터링',
  })
  @ApiQuery({ name: 'search', required: false, description: '파일명 검색' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findAll(@Query() filters: MediaFilterDto) {
    return this.mediaService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: '미디어 단일 조회',
    description: 'ID로 특정 미디어를 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '미디어를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '미디어 메타데이터 수정',
    description: '미디어의 alt, caption, 폴더를 수정합니다',
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({
    status: 404,
    description: '미디어 또는 폴더를 찾을 수 없음',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '미디어 삭제 (소프트 삭제)',
    description: '미디어를 소프트 삭제합니다 (파일은 유지)',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '미디어를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  @Delete(':id/hard')
  @ApiOperation({
    summary: '미디어 영구 삭제',
    description: '미디어를 DB와 디스크에서 완전히 삭제합니다',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '미디어를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  hardDelete(@Param('id') id: string) {
    return this.mediaService.hardDelete(id);
  }
}
