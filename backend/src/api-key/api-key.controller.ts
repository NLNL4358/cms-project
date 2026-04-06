import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  create(
    @Body() body: { name: string; permissions?: string[]; expiresAt?: string | null },
  ) {
    return this.service.create(body);
  }

  @Patch(':id/toggle')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  toggle(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.toggle(id, body.isActive);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
