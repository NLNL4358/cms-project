import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** 전체 설정 조회 */
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('settings:read', '*')
  findAll() {
    return this.settingsService.findAllForClient();
  }

  /** 설정 일괄 업데이트 */
  @Patch()
  @UseGuards(PermissionsGuard)
  @Permissions('settings:update', '*')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateMany(dto.settings);
  }
}
