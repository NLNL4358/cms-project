import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ example: 'editor@cms.com', required: false })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '홍길동', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: UserType, required: false })
  @IsEnum(UserType)
  @IsOptional()
  type?: UserType;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: ['role-id-1'],
    description: '할당할 역할 ID 목록 (기존 역할 교체)',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roleIds?: string[];
}
