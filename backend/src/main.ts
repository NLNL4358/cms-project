import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
      configService.get('cors.adminUrl') || 'http://localhost:5173',
      configService.get('cors.publicUrl') || 'http://localhost:5174',
    ],
    credentials: true,
  });

  // Static file serving (업로드된 파일 접근)
  const uploadPath = configService.get('upload.path') || './uploads';
  app.useStaticAssets(uploadPath, {
    prefix: '/uploads/',
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('CMS API Documentation')
    .setDescription('범용 CMS 플랫폼 API 문서')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', '인증 관련 API')
    .addTag('Content Types', '콘텐츠 타입 관리 API')
    .addTag('Contents', '콘텐츠 관리 API')
    .addTag('Media', '미디어 파일 관리 API')
    .addTag('Media Folders', '미디어 폴더 관리 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('port');
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
