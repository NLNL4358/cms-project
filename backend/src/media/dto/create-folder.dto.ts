import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    example: '제품 이미지',
    description: '폴더 이름',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'cmkqmfvs30000rcui4qbx7jlb',
    description: '상위 폴더 ID (계층 구조)',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
