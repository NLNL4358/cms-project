import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

export class CreateContentDto {
  @ApiProperty({
    example: 'cmkqmfvs30000rcui4qbx7jlb',
    description: '콘텐츠 타입 ID',
  })
  @IsString()
  @IsNotEmpty()
  contentTypeId: string;

  @ApiProperty({
    example: '첫 번째 블로그 포스트',
    description: '콘텐츠 제목',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'my-first-blog-post',
    description: '콘텐츠 slug (URL에 사용, 소문자/숫자/하이픈만 가능)',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다',
  })
  slug: string;

  @ApiProperty({
    example: {
      content: '블로그 포스트의 본문 내용입니다.',
      thumbnail: '/uploads/image.jpg',
      tags: ['개발', '블로그'],
    },
    description:
      '콘텐츠 데이터 (ContentType의 fields 정의에 따라 동적으로 구성)',
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiProperty({
    example: 'DRAFT',
    description: '콘텐츠 상태',
    enum: ContentStatus,
    required: false,
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiProperty({
    example: '2026-12-31T23:59:59Z',
    description: '예약 발행 시간 (ISO 8601 형식)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
