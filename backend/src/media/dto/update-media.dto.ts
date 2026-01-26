import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMediaDto {
  @ApiProperty({
    example: '제품 이미지',
    description: '이미지 대체 텍스트',
    required: false,
  })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiProperty({
    example: '2024년 신제품',
    description: '이미지 설명',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    example: 'cmkqmfvs30000rcui4qbx7jlb',
    description: '폴더 ID (폴더 이동)',
    required: false,
  })
  @IsString()
  @IsOptional()
  folderId?: string;
}
