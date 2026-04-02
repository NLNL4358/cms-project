import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'editor@cms.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: '비밀번호 (8자 이상)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;

  @ApiProperty({ example: '홍길동', description: '이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'ADMIN',
    description: '사용자 타입',
    enum: UserType,
  })
  @IsEnum(UserType)
  @IsOptional()
  type?: UserType;

  @ApiProperty({
    example: ['role-id-1'],
    description: '할당할 역할 ID 목록',
    required: false,
    type: [String],
  })
  @ApiProperty({ example: true, description: '활성 상태', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roleIds?: string[];
}
