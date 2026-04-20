import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContentFormDto {
  @ApiProperty({
    example: '블로그 포스트',
    description: '콘텐츠 폼 이름',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'blog-post',
    description: '고유주소 (소문자, 숫자, 하이픈만 가능)',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @IsNotEmpty({ message: '고유주소를 입력하세요' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: '고유주소는 소문자, 숫자, 하이픈(-)만 사용 가능합니다',
  })
  slug: string;

  @ApiProperty({
    example: '블로그 게시글 폼',
    description: '콘텐츠 폼 설명',
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
    description: '콘텐츠 폼의 필드 정의 (배열)',
  })
  @IsArray()
  @IsNotEmpty()
  fields: any[];

  @ApiProperty({
    example: { icon: 'article', color: '#3b82f6' },
    description: '콘텐츠 폼의 추가 옵션',
    required: false,
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;

  @ApiProperty({
    example: 'clxxxxxxxx',
    description: '소속 카테고리 ID (없으면 카테고리 없음)',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryId?: string | null;
}
