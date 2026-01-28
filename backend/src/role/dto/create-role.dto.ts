import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Content Editor',
    description: '역할 이름',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'content-editor',
    description: '역할 slug (소문자, 숫자, 하이픈만 가능)',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다',
  })
  slug: string;

  @ApiProperty({
    example: '콘텐츠를 생성하고 편집할 수 있는 역할',
    description: '역할 설명',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['content:read', 'content:create', 'content:update', 'media:read'],
    description: '권한 목록 (resource:action 형식)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions: string[];
}
