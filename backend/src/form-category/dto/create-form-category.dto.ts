import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormCategoryDto {
  @ApiProperty({ example: '유저 게시판', description: '카테고리 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '사용자 참여형 게시판 묶음', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 0, description: '정렬 순서 (작을수록 먼저)', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
