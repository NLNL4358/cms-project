import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
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
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: '.env',
    }),
    // Rate Limiting (Admin API 기본: 300 요청/분)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 300,
      },
    ]),
    // 스케줄링 모듈
    ScheduleModule.forRoot(),
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
    // 크론 작업 모듈
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 글로벌 Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
