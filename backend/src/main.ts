import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 전역 파이프 설정 (validation)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 전역 예외 필터
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS 설정
  app.enableCors({
    origin: [
      configService.get('cors.adminUrl'),
      configService.get('cors.publicUrl'),
    ],
    credentials: true,
  });

  const port = configService.get('port');
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
