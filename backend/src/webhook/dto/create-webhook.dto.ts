import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  url: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];

  @IsString()
  @IsOptional()
  secret?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
