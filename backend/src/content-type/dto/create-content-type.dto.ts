import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContentTypeDto {
  @ApiProperty({
    example: '블로그 포스트',
    description: '콘텐츠 타입 이름',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'blog-post',
    description: '콘텐츠 타입 slug (소문자, 숫자, 하이픈만 가능)',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다',
  })
  slug: string;

  @ApiProperty({
    example: '블로그 게시글 타입',
    description: '콘텐츠 타입 설명',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: {
      title: { type: 'string', required: true },
      content: { type: 'text', required: true },
      thumbnail: { type: 'image', required: false },
    },
    description: '콘텐츠 타입의 필드 정의',
  })
  @IsObject()
  @IsNotEmpty()
  fields: Record<string, any>;

  @ApiProperty({
    example: { icon: 'article', color: '#3b82f6' },
    description: '콘텐츠 타입의 추가 옵션',
    required: false,
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}
