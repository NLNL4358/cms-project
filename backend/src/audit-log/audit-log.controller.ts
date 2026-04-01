import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /** 로그 목록 조회 (필터 + 페이지네이션) */
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('audit-log:read', '*')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.auditLogService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      userId,
      action,
      entity,
      startDate,
      endDate,
      search,
    });
  }

  /** 필터용 액션 목록 */
  @Get('actions')
  @UseGuards(PermissionsGuard)
  @Permissions('audit-log:read', '*')
  getActions() {
    return this.auditLogService.getActions();
  }

  /** 필터용 엔티티 목록 */
  @Get('entities')
  @UseGuards(PermissionsGuard)
  @Permissions('audit-log:read', '*')
  getEntities() {
    return this.auditLogService.getEntities();
  }

  /** 로그 상세 조회 */
  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('audit-log:read', '*')
  findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }
}
