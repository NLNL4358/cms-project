import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { RoleModule } from '../role/role.module';

const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

@Module({
  imports: [
    RoleModule,
    MulterModule.register({
      storage: diskStorage({
        destination: backupDir,
        filename: (_req, file, cb) => {
          const name = `_upload-${Date.now()}${path.extname(file.originalname)}`;
          cb(null, name);
        },
      }),
    }),
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
