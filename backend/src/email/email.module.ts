import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { SettingsModule } from '../settings/settings.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [SettingsModule, RoleModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
