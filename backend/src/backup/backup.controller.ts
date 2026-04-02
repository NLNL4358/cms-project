import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /** 백업 생성 */
  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  create(@Body() body: { description?: string }) {
    return this.backupService.create(body?.description);
  }

  /** 백업 목록 */
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  findAll() {
    return this.backupService.findAll();
  }

  /** 외부 파일 업로드 → 복원 (정적 경로를 파라미터 경로보다 먼저 선언) */
  @Post('upload-restore')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  @UseInterceptors(FileInterceptor('file'))
  uploadRestore(@UploadedFile() file: Express.Multer.File) {
    return this.backupService.restoreFromUpload(file);
  }

  /** 백업 다운로드 */
  @Get(':filename/download')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const filepath = await this.backupService.getFilePath(filename);
    res.download(filepath, filename);
  }

  /** 백업 복원 */
  @Post(':filename/restore')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  restore(@Param('filename') filename: string) {
    return this.backupService.restore(filename);
  }

  /** 백업 삭제 */
  @Delete(':filename')
  @UseGuards(PermissionsGuard)
  @Permissions('*')
  remove(@Param('filename') filename: string) {
    return this.backupService.remove(filename);
  }
}
