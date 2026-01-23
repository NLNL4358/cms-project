import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  Matches,
} from 'class-validator';

export class CreateContentTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다',
  })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  fields: Record<string, any>;

  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}
