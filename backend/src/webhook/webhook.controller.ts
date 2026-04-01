import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('webhook:create', '*')
  create(@Body() dto: CreateWebhookDto) {
    return this.webhookService.create(dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('webhook:read', '*')
  findAll() {
    return this.webhookService.findAll();
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('webhook:read', '*')
  findOne(@Param('id') id: string) {
    return this.webhookService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('webhook:update', '*')
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('webhook:delete', '*')
  remove(@Param('id') id: string) {
    return this.webhookService.remove(id);
  }

  /** 테스트 발송 */
  @Post(':id/test')
  @UseGuards(PermissionsGuard)
  @Permissions('webhook:update', '*')
  test(@Param('id') id: string) {
    return this.webhookService.test(id);
  }
}
