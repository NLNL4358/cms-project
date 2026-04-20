import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContentFormModule } from './content-form/content-form.module';
import { FormCategoryModule } from './form-category/form-category.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TasksModule } from './tasks/tasks.module';
import { SettingsModule } from './settings/settings.module';
import { AuditLogModule } from './audit-log/audit-log.module';

import { WebhookModule } from './webhook/webhook.module';
import { ImportExportModule } from './import-export/import-export.module';
import { BackupModule } from './backup/backup.module';
import { NotificationModule } from './notification/notification.module';
import { SearchModule } from './search/search.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { PublicApiModule } from './public-api/public-api.module';
import { EmailModule } from './email/email.module';

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
    // 콘텐츠 폼 모듈
    ContentFormModule,
    // 콘텐츠 폼 카테고리 모듈
    FormCategoryModule,
    // 콘텐츠 모듈
    ContentModule,
    // 미디어 모듈
    MediaModule,
    RoleModule,
    // 사용자 모듈
    UserModule,
    // 대시보드 모듈
    DashboardModule,
    // 크론 작업 모듈
    TasksModule,
    // 시스템 설정 모듈
    SettingsModule,
    // 감사 로그 모듈
    AuditLogModule,
    // Webhook 모듈
    WebhookModule,
    // Import/Export 모듈
    ImportExportModule,
    // 백업/복원 모듈
    BackupModule,
    // 알림 모듈
    NotificationModule,
    // 검색 모듈
    SearchModule,
    // API 키 모듈
    ApiKeyModule,
    // Public API 모듈 (외부 통합용)
    PublicApiModule,
    // 이메일 모듈
    EmailModule,
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
