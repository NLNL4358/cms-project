import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
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
    example: [
      { name: 'title', type: 'text', label: '제목', required: true },
      { name: 'content', type: 'richtext', label: '내용', required: true },
      { name: 'thumbnail', type: 'image', label: '썸네일', required: false },
    ],
    description: '콘텐츠 타입의 필드 정의 (배열)',
  })
  @IsArray()
  @IsNotEmpty()
  fields: any[];

  @ApiProperty({
    example: { icon: 'article', color: '#3b82f6' },
    description: '콘텐츠 타입의 추가 옵션',
    required: false,
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}
