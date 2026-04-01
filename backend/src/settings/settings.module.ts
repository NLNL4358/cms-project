import { Module, OnModuleInit } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
  constructor(private settingsService: SettingsService) {}

  /** 서버 시작 시 기본 설정값 자동 시딩 */
  async onModuleInit() {
    await this.settingsService.seedDefaults();
  }
}
