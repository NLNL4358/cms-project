import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /** 테스트 이메일 발송 (관리자용) */
  @Post('test')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  sendTest(@Body() body: { to: string }) {
    return this.emailService.sendTest(body.to);
  }
}
