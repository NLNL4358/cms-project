import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('import-export')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  /** JSON 내보내기 */
  @Get('export/json')
  @UseGuards(PermissionsGuard)
  @Permissions('content:read', '*')
  async exportJson(
    @Query('contentTypeId') contentTypeId: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const data = await this.service.exportJson(contentTypeId, { status });
    const filename = `export-${data.contentType.slug}-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  /** CSV 내보내기 */
  @Get('export/csv')
  @UseGuards(PermissionsGuard)
  @Permissions('content:read', '*')
  async exportCsv(
    @Query('contentTypeId') contentTypeId: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportCsv(contentTypeId, { status });

    // BOM 추가 (엑셀 한글 깨짐 방지)
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`);
    res.send(bom + csv);
  }

  /** 가져오기 미리보기 (유효성 검사) */
  @Post('import/preview')
  @UseGuards(PermissionsGuard)
  @Permissions('content:create', '*')
  importPreview(
    @Body() body: { contentTypeId: string; items: any[] },
  ) {
    return this.service.importPreview(body.contentTypeId, body.items);
  }

  /** 가져오기 실행 */
  @Post('import/execute')
  @UseGuards(PermissionsGuard)
  @Permissions('content:create', '*')
  importExecute(
    @Body() body: { contentTypeId: string; items: any[]; overwrite?: boolean },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.importExecute(body.contentTypeId, userId, body.items, body.overwrite);
  }

  /** CSV 파싱 (프론트엔드에서 파일 업로드 후 파싱 요청) */
  @Post('parse/csv')
  @UseGuards(PermissionsGuard)
  @Permissions('content:create', '*')
  parseCsv(@Body() body: { csvText: string }) {
    return this.service.parseCsv(body.csvText);
  }
}
