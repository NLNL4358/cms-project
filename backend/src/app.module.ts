import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContentTypeModule } from './content-type/content-type.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { RoleModule } from './role/role.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: '.env',
    }),
    // Prisma 모듈
    PrismaModule,
    // 인증 모듈
    AuthModule,
    // 콘텐츠 타입 모듈
    ContentTypeModule,
    // 콘텐츠 모듈
    ContentModule,
    // 미디어 모듈
    MediaModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
