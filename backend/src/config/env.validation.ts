import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  // 서버 설정
  @IsNumber()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  NODE_ENV: string;

  // 데이터베이스
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // JWT
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN: string;

  // 파일 업로드
  @IsString()
  @IsNotEmpty()
  UPLOAD_PATH: string;

  @IsNumber()
  MAX_FILE_SIZE: number;

  // CORS
  @IsString()
  @IsNotEmpty()
  ADMIN_URL: string;

  @IsString()
  @IsNotEmpty()
  PUBLIC_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
