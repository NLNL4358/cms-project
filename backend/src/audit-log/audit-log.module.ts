import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, RoleModule, NotificationModule],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditLogInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: AuditLogInterceptor,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
