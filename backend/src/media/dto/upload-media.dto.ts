import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadMediaDto {
  @ApiProperty({
    example: 'cmkqmfvs30000rcui4qbx7jlb',
    description: '미디어를 저장할 폴더 ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiProperty({
    example: '제품 이미지',
    description: '이미지 대체 텍스트 (접근성)',
    required: false,
  })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiProperty({
    example: '2024년 신제품 런칭 이미지',
    description: '이미지 설명',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;
}
