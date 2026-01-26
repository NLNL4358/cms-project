import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MediaTypeFilter {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export class MediaFilterDto {
  @ApiProperty({
    example: 'cmkqmfvs30000rcui4qbx7jlb',
    description: '폴더 ID로 필터링',
    required: false,
  })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME 타입으로 필터링',
    required: false,
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiProperty({
    example: 'image',
    description: '파일 카테고리로 필터링',
    enum: MediaTypeFilter,
    required: false,
  })
  @IsEnum(MediaTypeFilter)
  @IsOptional()
  type?: MediaTypeFilter;

  @ApiProperty({
    example: 'product',
    description: '파일명으로 검색',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: 1,
    description: '페이지 번호',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: '페이지당 항목 수',
    required: false,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
